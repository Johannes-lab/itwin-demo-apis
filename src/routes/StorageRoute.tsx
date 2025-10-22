import { useSearchParams } from "react-router-dom";
import StorageComponent from "../components/StorageComponent";

export default function StorageRoute() {
  const [searchParams] = useSearchParams();
  const iTwinId = searchParams.get('iTwinId');
  
  return <StorageComponent preselectedITwinId={iTwinId || undefined} />;
}
