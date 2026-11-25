require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const http = require("node:http");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const app = require("../app");
const User = require("../models/user");
const HostProfile = require("../models/hostProfile");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const Review = require("../models/review");

let server;
let baseUrl;
const createdUserIds = [];
const createdListingIds = [];

async function api(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

test.before(async () => {
  await connectDB();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  for (const listingId of createdListingIds) {
    const bookings = await Booking.find({ listing: listingId }).select("_id");
    for (const b of bookings) {
      await Payment.deleteMany({ booking: b._id });
    }
    await Review.deleteMany({ listing: listingId });
    await Booking.deleteMany({ listing: listingId });
    await Listing.findByIdAndDelete(listingId);
  }

  for (const userId of createdUserIds) {
    await HostProfile.deleteOne({ user: userId });
    await User.findByIdAndDelete(userId);
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
});

test("Marketplace end-to-end guest, customer, host, payment, review, and security flows", async () => {
  const ts = Date.now();

  // 1. Register Host A, Host B, Customer A, Customer B
  const signup = async (prefix) => {
    const username = `${prefix}_${ts}`;
    const res = await api("/api/auth/signup", {
      method: "POST",
      body: { username, email: `${username}@example.com`, password: "password123" },
    });
    assert.equal(res.status, 201);
    createdUserIds.push(res.data.user._id);
    return res.data;
  };

  const hostA = await signup("it_hostA");
  const hostB = await signup("it_hostB");
  const custA = await signup("it_custA");
  const custB = await signup("it_custB");

  // 2. Non-host customer cannot create listing or access host dashboard
  const nonHostCreate = await api("/api/listings", {
    method: "POST",
    token: custA.token,
  });
  assert.equal(nonHostCreate.status, 403);

  const nonHostMe = await api("/api/hosts/me", { token: custA.token });
  assert.equal(nonHostMe.status, 403);

  // 3. Host onboarding (Host A and Host B)
  const onboardA = await api("/api/hosts/onboard", {
    method: "POST",
    token: hostA.token,
    body: {
      fullName: "Host Alpha",
      email: "alpha@example.com",
      phone: "+91 9876543210",
      contactDetails: "Daily 9AM-8PM IST",
      bio: "Mountain host",
    },
  });
  assert.equal(onboardA.status, 201);
  assert.equal(onboardA.data.user.isHost, true);

  const onboardB = await api("/api/hosts/onboard", {
    method: "POST",
    token: hostB.token,
    body: {
      fullName: "Host Beta",
      email: "beta@example.com",
      phone: "+91 9876543211",
      contactDetails: "Daily 10AM-7PM IST",
    },
  });
  assert.equal(onboardB.status, 201);

  // 4. Create published listing owned by Host A
  const listing = await Listing.create({
    title: `Integration Villa ${ts}`,
    description: "Spacious mountain retreat for integration testing",
    image: { url: "https://example.com/villa.jpg", filename: "" },
    images: [{ url: "https://example.com/villa.jpg", filename: "" }],
    price: 2500,
    cleaningFee: 500,
    location: "Manali",
    country: "India",
    propertyType: "Villa",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Wi-Fi", "Mountain view"],
    owner: hostA.user._id,
    status: "published",
    geometry: { type: "Point", coordinates: [77.1892, 32.2432] },
  });
  createdListingIds.push(listing._id);

  // 5. Guest browsing without login (public endpoints must succeed & hide private email)
  const pubList = await api("/api/listings");
  assert.equal(pubList.status, 200);
  const foundPub = pubList.data.listings.find(
    (l) => l._id === String(listing._id)
  );
  assert.ok(foundPub);
  assert.equal("email" in (foundPub.owner || {}), false);

  const pubDetail = await api(`/api/listings/${listing._id}`);
  assert.equal(pubDetail.status, 200);
  assert.equal("email" in (pubDetail.data.listing.owner || {}), false);

  // Unauthenticated guest blocked from booking and reviewing
  const guestBook = await api("/api/bookings", {
    method: "POST",
    body: {
      listingId: String(listing._id),
      checkIn: "2027-09-10",
      checkOut: "2027-09-12",
      guestsCount: 2,
    },
  });
  assert.equal(guestBook.status, 401);

  const guestReview = await api(`/api/listings/${listing._id}/reviews`, {
    method: "POST",
    body: { rating: 5, comment: "Nice!" },
  });
  assert.equal(guestReview.status, 401);

  // 6. Cross-host isolation checks (Host B cannot touch Host A's listing)
  const hostBListings = await api("/api/hosts/listings", { token: hostB.token });
  assert.equal(hostBListings.status, 200);
  assert.equal(
    hostBListings.data.listings.some((l) => l._id === String(listing._id)),
    false
  );

  const crossStatus = await api(`/api/hosts/listings/${listing._id}/status`, {
    method: "PATCH",
    token: hostB.token,
    body: { status: "inactive" },
  });
  assert.equal(crossStatus.status, 403);

  const crossDelete = await api(`/api/listings/${listing._id}`, {
    method: "DELETE",
    token: hostB.token,
  });
  assert.equal(crossDelete.status, 403);

  // 7. Quote calculation & booking validation
  const quote = await api(`/api/listings/${listing._id}/quote`, {
    method: "POST",
    body: { checkIn: "2027-09-10", checkOut: "2027-09-12", guestsCount: 2 },
  });
  assert.equal(quote.status, 200);
  assert.equal(quote.data.quote.nights, 2);
  assert.equal(quote.data.quote.baseAmount, 5000);
  assert.equal(quote.data.quote.serviceFee, 600);
  assert.equal(quote.data.quote.taxes, 1098);
  assert.equal(quote.data.quote.totalAmount, 7198);

  const overCapBook = await api("/api/bookings", {
    method: "POST",
    token: custA.token,
    body: {
      listingId: String(listing._id),
      checkIn: "2027-09-10",
      checkOut: "2027-09-12",
      guestsCount: 8,
    },
  });
  assert.equal(overCapBook.status, 400);

  // 8. Customer A creates booking -> overlap blocked -> Razorpay signature verification
  const createBook = await api("/api/bookings", {
    method: "POST",
    token: custA.token,
    body: {
      listingId: String(listing._id),
      checkIn: "2027-09-10",
      checkOut: "2027-09-12",
      guestsCount: 2,
    },
  });
  assert.equal(createBook.status, 201);
  assert.equal(createBook.data.booking.status, "Pending");
  const bookingId = createBook.data.booking._id;

  const overlapBook = await api("/api/bookings", {
    method: "POST",
    token: custB.token,
    body: {
      listingId: String(listing._id),
      checkIn: "2027-09-11",
      checkOut: "2027-09-13",
      guestsCount: 1,
    },
  });
  assert.equal(overlapBook.status, 409);

  // Cross-customer booking cancel blocked
  const crossCancel = await api(`/api/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    token: custB.token,
  });
  assert.equal(crossCancel.status, 403);

  // Razorpay signature verification (invalid rejected, valid confirms)
  process.env.RAZORPAY_KEY_ID = "rzp_test_integration";
  process.env.RAZORPAY_KEY_SECRET = "integration_secret_xyz";
  const orderId = `order_int_${ts}`;
  await Payment.create({
    booking: bookingId,
    user: custA.user._id,
    razorpayOrderId: orderId,
    amount: createBook.data.booking.totalAmount,
    amountInPaise: createBook.data.booking.totalAmount * 100,
    status: "Created",
  });

  const badVerify = await api("/api/payments/razorpay/verify", {
    method: "POST",
    token: custA.token,
    body: {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: "pay_bad",
      razorpay_signature: "tampered_sig",
    },
  });
  assert.equal(badVerify.status, 400);

  const paymentId = `pay_int_${ts}`;
  const validSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const goodVerify = await api("/api/payments/razorpay/verify", {
    method: "POST",
    token: custA.token,
    body: {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature,
    },
  });
  assert.equal(goodVerify.status, 200);
  assert.equal(goodVerify.data.booking.status, "Confirmed");
  assert.equal(goodVerify.data.booking.paymentStatus, "Paid");

  // 9. Customer A completes stay via Host A -> submits verified review -> anti-spoofing checks
  const uncompReview = await api(`/api/listings/${listing._id}/reviews`, {
    method: "POST",
    token: custA.token,
    body: { rating: 5, comment: "Premature review", bookingId },
  });
  assert.equal(uncompReview.status, 403);

  const completeRes = await api(`/api/hosts/bookings/${bookingId}/complete`, {
    method: "PATCH",
    token: hostA.token,
  });
  assert.equal(completeRes.status, 200);

  const spoofReview = await api(`/api/listings/${listing._id}/reviews`, {
    method: "POST",
    token: custB.token,
    body: { rating: 1, comment: "Spoofed", bookingId },
  });
  assert.equal(spoofReview.status, 403);

  const validReview = await api(`/api/listings/${listing._id}/reviews`, {
    method: "POST",
    token: custA.token,
    body: { rating: 5, comment: "Amazing stay!", bookingId },
  });
  assert.equal(validReview.status, 201);
  assert.equal(validReview.data.averageRating, 5);
  assert.equal(validReview.data.reviewCount, 1);

  const dupReview = await api(`/api/listings/${listing._id}/reviews`, {
    method: "POST",
    token: custA.token,
    body: { rating: 4, comment: "Duplicate", bookingId },
  });
  assert.equal(dupReview.status, 409);

  // Customer A retains customer capabilities even if onboarded as host
  const custAMyBookings = await api("/api/bookings/me", { token: custA.token });
  assert.equal(custAMyBookings.status, 200);
  assert.equal(custAMyBookings.data.bookings.length, 1);
  assert.equal(custAMyBookings.data.bookings[0].hasReview, true);
});
