import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { getProjects } from "../../redux/slices/project.slice";
import { RootState } from "../../redux/store";

const HomePage = () => {
  const projectState = useAppSelector((state: RootState) => state.projectReducer);
  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   dispatch(getProjects());
  // }, [])
  return <>
    <div></div>
  </>
}

export default HomePage;