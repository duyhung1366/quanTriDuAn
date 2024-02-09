

import React, { useMemo } from 'react'
import { DialogTransitionUp } from "../dialog/DialogTransitions";
import { AppBar, Dialog, IconButton, Toolbar, Typography, Box, Stack, Button } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useAppSelector } from "../../redux/hooks";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { ProjectRole, TaskStatus, TaskDifficulty, TaskRole } from "../../../../common/constants";
import MenuItem from '@mui/material/MenuItem';
import useProjectMember from "../../hooks/useProjectMember";
import { mapTaskDifficultyLabel, mapTaskStatusLabel } from '../../config/MapContraint';
import SearchIcon from "@mui/icons-material/Search";
import { removeAccents } from '../unidecode';
import SearchUser from './SearchUser';
import * as XLSX from 'xlsx';
import _ from "lodash";
enum Option {
    STATUS,
    POINT,
    DIFFICULTY
}


type TaskData = {
    [TaskStatus: number]: number;
}

type PointDataValue = {
    total: number;
    completed: number;
}

type PointData = {
    estimatePoints: PointDataValue;
    testEstimatePoints: PointDataValue;
    reviewEstimatePoints: PointDataValue;
}

type DifficultyData = {
    [TaskDifficulty: number]: {
        [TaskStatus: number]: number;
    }
}

const ManagerStatistical = (props: { open: boolean, onClose: () => void }) => {

    const { open, onClose } = props;

    const sprintState = useAppSelector(state => state.sprintReducer)
    const taskState = useAppSelector(state => state.taskReducer)
    const projectState = useAppSelector(state => state.projectReducer);
    const taskBySprintId = Object.values(taskState.tasks).filter(e => e.sprintId === sprintState.currentSprint._id)
    const getMembersProject = useProjectMember(projectState.currentProject?._id);
    const mapUserData = useAppSelector((state) => state.userReducer.mapUserData);
    const [option, setOption] = React.useState<Option>(Option.STATUS)
    const auth = useAppSelector(state => state.authReducer)
    const hasSprintMasterOrOwnerPermission = !!(useProjectMember(sprintState.currentSprint.projectId)).find((e) => e.role !== ProjectRole.SPRINT_MEMBER && e.userId === auth.user._id);
    const searchUser = taskState.searchUserStatistic


    const taskDataByStatus = useMemo(() => {
        const taskData: { [userId: string]: TaskData } = {};
        taskBySprintId.forEach(task => {
            task.assignments.forEach(assign => {
                const { userId } = assign;
                const taskUserData = taskData[userId] || {
                    [TaskStatus.OPEN]: 0,
                    [TaskStatus.IN_PROGRESS]: 0,
                    [TaskStatus.REVIEW]: 0,
                    [TaskStatus.BUG]: 0,
                    [TaskStatus.COMPLETE]: 0
                };
                taskData[userId] = {
                    ...taskUserData,
                    [task.status]: (taskUserData[task.status] || 0) + TaskDifficulty.MAJOR
                }
            });
        });
        return Object.entries(taskData).map(([userId, status]) => ({
            [userId]: status,
        }));
    }, [taskBySprintId]);


    const taskDataByPoint = useMemo(() => {
        const taskData: { [userId: string]: PointData } = {};
        taskBySprintId.forEach(task => {
            task.assignments.forEach(assignment => {
                const userId = assignment.userId;
                if (!taskData[userId]) {
                    taskData[userId] = {
                        estimatePoints: { total: 0, completed: 0 },
                        testEstimatePoints: { total: 0, completed: 0 },
                        reviewEstimatePoints: { total: 0, completed: 0 },
                    };
                }

                if (assignment.role === TaskRole.ASSIGNEE) {
                    taskData[userId].estimatePoints.total += (task.estimatePoints ?? 0);
                    if (task.status === TaskStatus.COMPLETE) {
                        taskData[userId].estimatePoints.completed += (task.estimatePoints ?? 0);
                    }
                }

                if (assignment.role === TaskRole.TESTER) {
                    taskData[userId].testEstimatePoints.total += (task.testEstimatePoints ?? 0);
                    if (task.status === TaskStatus.COMPLETE) {
                        taskData[userId].testEstimatePoints.completed += (task.testEstimatePoints ?? 0);
                    }
                }
                if (assignment.role === TaskRole.REVIEWER) {
                    if (task.status === TaskStatus.COMPLETE) {
                        taskData[userId].reviewEstimatePoints.completed += (task.reviewEstimatePoints ?? 0);
                    }
                    taskData[userId].reviewEstimatePoints.total += (task.reviewEstimatePoints ?? 0);
                }
            });
        });

        return Object.entries(taskData).map(([userId, pointDataValue]) => ({
            [userId]: pointDataValue,
        }));
    }, [taskBySprintId]);


    const members = getMembersProject.map((item) => {
        const findUser = mapUserData[item.userId]
        return { ...item, ...(findUser || {}) }
    })

    const pointByUser = members.map(member => {
        const taskData = taskDataByPoint.find(task => task[member._id])
        if (taskData) {
            const { estimatePoints, testEstimatePoints, reviewEstimatePoints } = taskData[member._id];
            return { ...member, estimatePoints, testEstimatePoints, reviewEstimatePoints };
        }
        return { ...member, estimatePoints: { total: 0, completed: 0 }, testEstimatePoints: { total: 0, completed: 0 }, reviewEstimatePoints: { total: 0, completed: 0 } }
    });

    const statusByUser = members.map(member => {
        const taskData = taskDataByStatus.find(data => data[member._id]);
        return {
            ...member,
            status: taskData ? taskData[member._id] : { [TaskStatus.OPEN]: 0, [TaskStatus.IN_PROGRESS]: 0, [TaskStatus.REVIEW]: 0, [TaskStatus.BUG]: 0, [TaskStatus.COMPLETE]: 0 }
        };
    });



    const taskDataByDiff = useMemo(() => {
        const taskData: { [userId: string]: DifficultyData } = {};
        const find = taskBySprintId.reduce((acc, task) => {
            task.assignments.forEach(assignment => {
                const { difficulty, status } = task;
                const id = assignment.userId;

                if (!acc[id]) {
                    acc[id] = {};
                }

                if (!acc[id][difficulty]) {
                    acc[id][difficulty] = {
                        [TaskStatus.OPEN]: 0,
                        [TaskStatus.IN_PROGRESS]: 0,
                        [TaskStatus.REVIEW]: 0,
                        [TaskStatus.BUG]: 0,
                        [TaskStatus.COMPLETE]: 0,
                    }
                }
                acc[id][difficulty][status]++;
            });

            return acc;
        }, taskData);


        return Object.entries(find).map(([userId, pointDataValue]) => ({
            [userId]: pointDataValue,
        }));

    }, [taskBySprintId]);



    const difficutlyByUser = members.map(member => {
        const taskData = taskDataByDiff.find(data => data[member._id]);
        return {
            ...member,
            difficutly: taskData ? taskData[member._id] : {}
        };
    });

    const dataByStatus = statusByUser.map((user) => {
        return {
            name: user.name,
            Todo: user.status[TaskStatus.OPEN],
            InProgress: user.status[TaskStatus.IN_PROGRESS],
            Review: user.status[TaskStatus.REVIEW],
            Bug: user.status[TaskStatus.BUG],
            Complete: user.status[TaskStatus.COMPLETE],
            Total: Object.values(user.status).reduce((a, b) => a + b)
        }
    })

    const mapStatus = {
        [TaskStatus.OPEN]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.REVIEW]: 0,
        [TaskStatus.BUG]: 0,
        [TaskStatus.COMPLETE]: 0,
    }
    const statusesDiff = ["todo", "inprogress", "bug", "review", "completed"];
    const statusesPoint = ['completed', 'total']

    const dataByDifficutly = difficutlyByUser.map((row) => {
        const { difficutly } = row
        const critical = difficutly[TaskDifficulty.CRITICAL] || mapStatus
        const major = difficutly[TaskDifficulty.MAJOR] || mapStatus
        const minor = difficutly[TaskDifficulty.MINOR] || mapStatus
        const trivial = difficutly[TaskDifficulty.TRIVIAL] || mapStatus

        return {
            Name: row.name,
            [`Crititcal`]: critical[TaskStatus.OPEN],
            "Crititcal_inprogress": critical[TaskStatus.IN_PROGRESS],
            "Crititcal_bug": critical[TaskStatus.BUG],
            [`Crititcal_review`]: critical[TaskStatus.REVIEW],
            [`Crititcal_completed`]: critical[TaskStatus.COMPLETE],
            [`Major`]: major[TaskStatus.OPEN],
            [`Major_inprogress`]: major[TaskStatus.IN_PROGRESS],
            [`Major_bug`]: major[TaskStatus.BUG],
            [`Major_review`]: major[TaskStatus.REVIEW],
            [`Major_completed`]: major[TaskStatus.COMPLETE],
            [`Minor`]: minor[TaskStatus.OPEN],
            [`Minor_inprogress`]: minor[TaskStatus.IN_PROGRESS],
            [`Minor_bug`]: minor[TaskStatus.BUG],
            [`Minor_review`]: minor[TaskStatus.REVIEW],
            [`Minor_completed`]: minor[TaskStatus.COMPLETE],
            [`Trivial`]: minor[TaskStatus.OPEN],
            [`Trivial_inprogress`]: trivial[TaskStatus.IN_PROGRESS],
            [`Trivial_bug`]: trivial[TaskStatus.BUG],
            [`Trivial_review`]: trivial[TaskStatus.REVIEW],
            [`Trivial_completed`]: trivial[TaskStatus.COMPLETE]
        }
    })


    const dataByPoint = pointByUser.map((member) => {
        const { estimatePoints, testEstimatePoints, reviewEstimatePoints } = member
        return {
            Name: member.name,
            [`Estimate`]: estimatePoints.completed,
            [`Estimate_total`]: estimatePoints.total,
            [`Review`]: reviewEstimatePoints.completed,
            [`Review_total`]: reviewEstimatePoints.total,
            [`Test`]: testEstimatePoints.completed,
            [`Test_total`]: testEstimatePoints.total,
            Total: estimatePoints.completed + reviewEstimatePoints.completed + testEstimatePoints.completed,
            [`Total_total`]: estimatePoints.total + reviewEstimatePoints.total + testEstimatePoints.total,
        }
    })

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        // Export status sheet
        const statusSheet = XLSX.utils.json_to_sheet(dataByStatus);
        XLSX.utils.book_append_sheet(wb, statusSheet, "Status");

        // Export point sheet
        const pointSheet = XLSX.utils.json_to_sheet([]);
        pointSheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
            { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } },
            { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } },
            { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } },
            { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } },
        ];
        const headersPoint = _.flatMap(["Estimate", "Review", "Test", "Total"], (mergedLabel) => {
            return [
                mergedLabel,
                ...statusesPoint.slice(1).map((status) => `${mergedLabel}_${status}`)
            ]
        });
        const subHeadersPoint = {
            Name: "", ...headersPoint.reduce((map, e) => {
                const [_, status] = e.split("_");
                if (!status) map[e] = "completed";
                else map[e] = status;
                return map;
            }, {})
        }
        XLSX.utils.sheet_add_json(pointSheet, [
            subHeadersPoint,
            ...dataByPoint
        ], { header: ["Name", ...headersPoint] });

        XLSX.utils.book_append_sheet(wb, pointSheet, "Points");
        // Export difficulty sheet
        const difficultySheet = XLSX.utils.json_to_sheet([]);
        difficultySheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
            { s: { r: 0, c: 1 }, e: { r: 0, c: 5 } },
            { s: { r: 0, c: 6 }, e: { r: 0, c: 10 } },
            { s: { r: 0, c: 11 }, e: { r: 0, c: 15 } },
            { s: { r: 0, c: 16 }, e: { r: 0, c: 20 } }
        ];
        const headerDifficutly = _.flatMap(["Crititcal", "Major", "Minor", "Trivial"], (mergedLabel) => {
            return [
                mergedLabel,
                ...statusesDiff.slice(1).map((status) => `${mergedLabel}_${status}`)
            ]
        });
        const subHeaderDifficutly = {
            Name: "", ...headerDifficutly.reduce((map, e) => {
                const [_, status] = e.split("_");
                if (!status) map[e] = "todo";
                else map[e] = status;
                return map;
            }, {})
        }

        XLSX.utils.sheet_add_json(difficultySheet, [
            subHeaderDifficutly,
            ...dataByDifficutly
        ], { header: ["Name", ...headerDifficutly] });

        XLSX.utils.book_append_sheet(wb, difficultySheet, "Difficulty");
        // Save the workbook
        XLSX.writeFile(wb, "statistic.xlsx");
    }
    console.log("Data by diff", dataByDifficutly)


    return (

        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={DialogTransitionUp}
        >
            <AppBar className="app-bar-project-members" sx={{ display: "flex" }}>
                <Toolbar>
                    <Stack direction="row" >
                        <IconButton className='btn-close-memProject' edge="start" color="inherit" onClick={onClose} sx={{ position: "absolute", center: 0, right: '0px' }}><Close /></IconButton>
                        <Typography className="app-bar-pm-project-name" variant="h5" component="div">Thống kê</Typography>
                    </Stack>
                </Toolbar>
                <MenuItem>
                </MenuItem>
            </AppBar>

            <Box sx={{ marginTop: "100px" }}>
                <Stack direction="row" spacing={2}>
                    <Button
                        onClick={() => setOption(Option.STATUS)}
                    >
                        Status
                    </Button>

                    <Button
                        onClick={() => setOption(Option.POINT)}
                    >
                        Point
                    </Button>
                    {hasSprintMasterOrOwnerPermission && (
                        <>
                            <Button onClick={() => setOption(Option.DIFFICULTY)}>Difficulty</Button>
                            <SearchUser />
                            <Button onClick={handleExport}>Export Excel</Button>
                        </>
                    )}
                </Stack>
            </Box>

            {
                option === Option.STATUS &&
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell align="center">Todo</TableCell>
                                <TableCell align="center">Inprogress</TableCell>
                                <TableCell align="center">Bug</TableCell>
                                <TableCell align="center">Review</TableCell>
                                <TableCell align="center">Complete</TableCell>
                                <TableCell align="center">Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {

                                (hasSprintMasterOrOwnerPermission ? (searchUser.length > 0 ? (statusByUser.filter(e => searchUser.includes(e.userId))) : (statusByUser)) : (statusByUser.filter(e => e._id === auth.user._id)))?.map((row) => {
                                    return (
                                        <TableRow
                                            key={row.name}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {row.name}
                                            </TableCell>
                                            <TableCell align="center">{row.status[TaskStatus.OPEN]}</TableCell>
                                            <TableCell align="center">{row.status[TaskStatus.IN_PROGRESS]}</TableCell>
                                            <TableCell align="center">{row.status[TaskStatus.BUG]}</TableCell>
                                            <TableCell align="center">{row.status[TaskStatus.REVIEW]}</TableCell>
                                            <TableCell align="center">{row.status[TaskStatus.COMPLETE]}</TableCell>
                                            <TableCell align="center">{row.status[TaskStatus.OPEN] + row.status[TaskStatus.IN_PROGRESS] + row.status[TaskStatus.BUG] + row.status[TaskStatus.REVIEW] + row.status[TaskStatus.COMPLETE]}</TableCell>
                                        </TableRow>
                                    )
                                })
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            }

            {
                option === Option.POINT &&

                <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell align="center">Estimate (Completed/Total)</TableCell>
                                <TableCell align="center">Review  (Completed/Total)</TableCell>
                                <TableCell align="center">Test  (Completed/Total)</TableCell>
                                <TableCell align="center">Total  (Completed/Total)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>

                            {
                                (hasSprintMasterOrOwnerPermission ? (searchUser.length > 0 ? (pointByUser.filter((e) => searchUser.includes(e.userId))) : (pointByUser)) : (pointByUser.filter((e) => e._id === auth.user._id)))?.map((row) => {
                                    const { estimatePoints, reviewEstimatePoints, testEstimatePoints } = row
                                    return (
                                        <TableRow
                                            key={row.name}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {row.name}
                                            </TableCell>
                                            <TableCell align="center">
                                                {estimatePoints.completed} /{estimatePoints.total}
                                            </TableCell>
                                            <TableCell align="center">{reviewEstimatePoints.completed}/{reviewEstimatePoints.total}</TableCell>
                                            <TableCell align="center">{testEstimatePoints.completed} /{testEstimatePoints.total}</TableCell>
                                            <TableCell align="center">{estimatePoints.completed + reviewEstimatePoints.completed + testEstimatePoints.completed} /{estimatePoints.total + reviewEstimatePoints.total + testEstimatePoints.total}</TableCell>
                                        </TableRow>
                                    )
                                })
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            }
            {
                option === Option.DIFFICULTY &&

                <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell >Critical</TableCell>
                                <TableCell >Major</TableCell>
                                <TableCell >Minor</TableCell>
                                <TableCell >Trival</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                (searchUser.length > 0 ? (difficutlyByUser.filter((e) => searchUser.includes(e.userId))) : (difficutlyByUser)).map((row) => {
                                    const { difficutly } = row
                                    const mapStatus = {
                                        [TaskStatus.OPEN]: 0,
                                        [TaskStatus.IN_PROGRESS]: 0,
                                        [TaskStatus.REVIEW]: 0,
                                        [TaskStatus.BUG]: 0,
                                        [TaskStatus.COMPLETE]: 0,
                                    }
                                    const critical = difficutly[TaskDifficulty.CRITICAL] || mapStatus
                                    const major = difficutly[TaskDifficulty.MAJOR] || mapStatus
                                    const minor = difficutly[TaskDifficulty.MINOR] || mapStatus
                                    const trivial = difficutly[TaskDifficulty.TRIVIAL] || mapStatus
                                    return (
                                        <TableRow
                                            key={row.name}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {row.name}
                                            </TableCell>
                                            <TableCell>
                                                {
                                                    Object.entries(critical).map(([status, count], index) => {
                                                        return (
                                                            <li key={index}>
                                                                {mapTaskStatusLabel[status]} : {count}
                                                            </li>
                                                        )
                                                    })
                                                }
                                                <li> Total : {(Object.values(critical)).reduce((a, b) => a + b)}</li>
                                            </TableCell>

                                            <TableCell>
                                                {
                                                    Object.entries(major).map(([status, count], index) => {
                                                        return (
                                                            <li key={index}>
                                                                {mapTaskStatusLabel[status]} : {count}
                                                            </li>
                                                        )
                                                    })
                                                }
                                                <li> Total : {(Object.values(major)).reduce((a, b) => a + b)}</li>
                                            </TableCell>

                                            <TableCell>
                                                {
                                                    Object.entries(minor).map(([status, count], index) => {
                                                        return (
                                                            <li key={index}>
                                                                {mapTaskStatusLabel[status]} : {count}
                                                            </li>
                                                        )
                                                    })
                                                }
                                                <li> Total : {(Object.values(minor)).reduce((a, b) => a + b)}</li>
                                            </TableCell>

                                            <TableCell>
                                                {
                                                    Object.entries(trivial).map(([status, count], index) => {
                                                        return (
                                                            <li key={index}>
                                                                {mapTaskStatusLabel[status]} : {count}
                                                            </li>
                                                        )
                                                    })
                                                }
                                                <li> Total : {(Object.values(trivial)).reduce((a, b) => a + b)}</li>
                                            </TableCell>

                                        </TableRow>
                                    )
                                })
                            }
                        </TableBody>
                    </Table>
                </TableContainer>

            }
        </Dialog >
    )
}

export default ManagerStatistical;
