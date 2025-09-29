import "./App.css";
import UploadWidget from "./components/upload/UploadWidget";
import useQueryParams from "./hooks/useQueryParams";

const FILE_UPLOAD_URL = "https://dev-hansen-rosasco.web.app/";

function App() {
  const { token, claimName, claimId, fullName, userId } = useQueryParams();
  const allParamsPresent = Boolean(token && claimName && claimId && fullName && userId);

  return (
    <>
      {allParamsPresent ? (
        <>
          <h1>Upload Document for {claimName}</h1>
          <UploadWidget
            uploadUrl={FILE_UPLOAD_URL}
            token={token as string}
            claimName={claimName as string}
            claimId={claimId as string}
            fullName={fullName as string}
            userId={userId as string}
          />
        </>
      ) : (
        <div role="alert" style={{ marginTop: 16 }}>
          <p>This page is not available.</p>
        </div>
      )}
    </>
  );
}

export default App;
