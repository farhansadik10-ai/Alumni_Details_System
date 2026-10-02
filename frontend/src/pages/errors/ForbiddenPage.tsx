import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../routes/paths";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="Access denied"
      subTitle="You do not have permission to open this page."
      extra={
        <Button type="primary" onClick={() => navigate(PATHS.DASHBOARD)}>
          Back to dashboard
        </Button>
      }
    />
  );
}
