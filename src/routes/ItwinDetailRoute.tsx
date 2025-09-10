import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MyiTwinsComponent from "../components/MyiTwinsComponent";

// Lightweight wrapper so URL contains /itwins/:itwinId. The MyiTwinsComponent
// already opens a modal when an iTwin is selected; this route ensures deep-linking.
export default function ItwinDetailRoute() {
  const { itwinId } = useParams();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  // We don't need to pass props; the selection will be handled by the component's own UI.
  // If no id present, redirect to list.
  useEffect(() => {
    if (!itwinId) navigate('/itwins', { replace: true });
    else setReady(true);
  }, [itwinId, navigate]);

  if (!ready) return null;
  return <MyiTwinsComponent />;
}
