import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Redirect to iModels view when an iTwin is selected
export default function ItwinDetailRoute() {
  const { itwinId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!itwinId) {
      navigate('/itwins', { replace: true });
    } else {
      // Redirect to iModels view for the selected iTwin
      navigate(`/itwins/${itwinId}/imodels`, { replace: true });
    }
  }, [itwinId, navigate]);

  return null;
}
