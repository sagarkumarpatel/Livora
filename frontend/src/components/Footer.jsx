import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="f-info">
        <div className="f-info-socials">
          <i className="fa-brands fa-square-facebook" />
          <i className="fa-brands fa-square-instagram" />
          <i className="fa-brands fa-linkedin" />
        </div>
        <div className="f-info-brand">&copy; Livora Private Limited</div>
        <div className="f-info-links">
          <Link to="/privacy">Privacy</Link>
          <span className="mx-2">&middot;</span>
          <Link to="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
