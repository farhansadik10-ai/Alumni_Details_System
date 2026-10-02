import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../routes/paths";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="The page you are looking for does not exist."
      extra={
        <Button type="primary" onClick={() => navigate(PATHS.DASHBOARD)}>
          Back to dashboard
        </Button>
      }
    />
  );
}
