import { unwrapResult } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";
import ProjectMember from "../../../common/models/project_member";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { getProjectMember } from "../redux/slices/project-members.slice";
import { RootState } from "../redux/store";

export default function useProjectMember(projectId: string) {
  const mapProjectMember = useAppSelector((state: RootState) => state.projectMemberReducer.mapProjectMember);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const dispatch = useAppDispatch();
  // console.log("projectId", mapProjectMember[projectId]?.data);

  useEffect(() => {
    if (!projectId) return;
    if (mapProjectMember[projectId]?.loading) return;
    if (mapProjectMember[projectId]?.loaded) {
      setProjectMembers(mapProjectMember[projectId]?.data ?? []);
    }
    else {
      dispatch(getProjectMember(projectId))
        .then(unwrapResult)
        .then((data) => {
          setProjectMembers(data);
        })
    }
  }, [projectId, mapProjectMember[projectId]]);

  return projectMembers;
}