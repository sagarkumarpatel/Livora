import { Link } from "react-router-dom";

export default function StaticInfoPage({ title, description }) {
  return (
    <div className="row mt-4 mb-5">
      <div className="col-md-8 offset-md-2">
        <h2 className="mb-3">{title}</h2>
        <p className="text-muted">{description}</p>
        <Link to="/listings" className="btn btn-dark mt-2">
          Back to Explore
        </Link>
      </div>
    </div>
  );
}
