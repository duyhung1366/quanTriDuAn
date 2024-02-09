import { CircularProgress } from "@mui/material"

const LoadingPage = () => {
  return <div style={{ width: "100%", height: "100vh", color: "#007aff", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <CircularProgress color="inherit" size={100} />
  </div>
}

export default LoadingPage;