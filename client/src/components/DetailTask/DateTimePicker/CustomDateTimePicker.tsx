import React, { useState, useRef, useEffect } from 'react';
import { DatePicker } from 'rsuite';
import "./DateTimePicker.scss"
import { Box, IconButton, TextField } from '@mui/material';
import { useAppSelector } from '../../../redux/hooks';
import AddMemIcon from '../../icons/AddMemIcon';
import ArrowDatePickerIcon from '../../icons/ArrowDatePicker';
import CalenderDatePicker from '../../icons/CalenderDatePicker';
import DueDatePicker from '../../icons/DueDatePicker';
import BootstrapTooltip from '../../CustomToolTip';
import useProjectMember from '../../../hooks/useProjectMember';
import { ProjectRole, SprintStatus } from '../../../../../common/constants';
import moment from 'moment';

interface PropsPicker {
    handleConfirmUpdateTask?: any;
}
function CustomDateTimePicker(props: PropsPicker) {
    const { handleConfirmUpdateTask } = props
    const currentTask = useAppSelector(state => state.taskReducer?.currentTask)
    const startDateInit = currentTask && currentTask?.startDate ? new Date(currentTask?.startDate) : null
    const dueDateInit = currentTask && currentTask?.deadline ? new Date(currentTask?.deadline) : null

    const [startDate, setStartDate] = useState(startDateInit ?? null);
    const [dueDate, setDueDate] = useState(dueDateInit ?? null);
    const [showModalStartDate, setShowModalStartDate] = useState(false);
    const [showModalDueDate, setShowModalDueDate] = useState(false);
    const startDateRef = useRef<HTMLDivElement>(null);
    const dueDateRef = useRef<HTMLDivElement>(null);
    const currentSprint = useAppSelector(state => state.sprintReducer.currentSprint)
    const auth = useAppSelector(state => state.authReducer)


    const hasMasterOrOwnerPermission = !!(useProjectMember(currentTask?.projectId)).find((e) => e.role !== ProjectRole.SPRINT_MEMBER && e.userId === auth.user._id);
    const isDisabledEditSprint = !hasMasterOrOwnerPermission && (currentSprint?.status === SprintStatus.ARCHIVED)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!startDateRef.current.contains(event.target as Node)) {
                setShowModalStartDate(false);

            }
            if (!dueDateRef.current.contains(event.target as Node)) {
                setShowModalDueDate(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [startDateRef, dueDateRef]);

    const handleChangeStartDate = (newValue: Date) => {
        setStartDate(newValue)
        setShowModalStartDate(false)
        handleConfirmUpdateTask({ startDate: newValue.getTime() })
    }

    const handleChangeDueDate = (newValue: Date) => {
        setDueDate(newValue)
        setShowModalDueDate(false)
        handleConfirmUpdateTask({ deadline: newValue.getTime() })
    }

    return (
        <Box className='picker-rsuite-container'>
            <Box className='start-create-task'>
                <label className="start-create-task-label"> created at</label>
                <p className="start-create-task-text"> {moment(currentTask?.createdAt).format('DD/MM/YYYY')}</p>
            </Box>

            <Box className="start-date-picker" ref={startDateRef} >
                {
                    startDate

                        ? <Box className='custom-date-time-picker' >
                            <label className='label-date-picker'>START DATE</label>
                            <Box className='btn-remove-date-picker' onClick={() => {
                                handleConfirmUpdateTask({ startDate: null })
                                setStartDate(null)
                            }}><AddMemIcon /></Box>
                            <DatePicker
                                value={startDate}
                                onChange={(newValue) => handleChangeStartDate(newValue)}
                                format='MMM dd yyyy, HH:mmaa'
                                container={() => document.querySelector(".start-date-picker")}
                                disabled={isDisabledEditSprint}
                            />
                        </Box>
                        : <BootstrapTooltip placement='top' title='Start Date'>
                            <IconButton disabled={isDisabledEditSprint} disableRipple onClick={() => setShowModalStartDate(true)} sx={{ margin: '0 15px 0 20px' }} className='btn-open-date-picker'><CalenderDatePicker /></IconButton>
                        </BootstrapTooltip>
                }
                {
                    showModalStartDate
                    &&
                    <DatePicker
                        value={startDate as Date}
                        open
                        onClose={() => setShowModalStartDate(false)}
                        onChange={(newValue) => handleChangeStartDate(newValue)}
                        format='MMM dd yyyy, HH:mmaa'
                        container={() => document.querySelector(".start-date-picker")}
                        className='picker-start-date-rsuite'
                    />


                }
            </Box>
            <Box>
                <ArrowDatePickerIcon />
            </Box>
            <Box className="due-date-picker" ref={dueDateRef}>
                {
                    dueDate
                        ? <Box className='custom-date-time-picker'>
                            <label className='label-date-picker'>DUE DATE</label>
                            <Box className='btn-remove-date-picker' onClick={() => {
                                handleConfirmUpdateTask({ deadline: null })
                                setDueDate(null)
                            }}><AddMemIcon /></Box>
                            <DatePicker
                                value={dueDate}
                                format='MMM dd yyyy, HH:mmaa'
                                onClose={() => setShowModalDueDate(false)}
                                onChange={(newValue) => handleChangeDueDate(newValue)}
                                container={() => document.querySelector(".due-date-picker")}
                                className='due-date-rsuite'
                                disabled={isDisabledEditSprint}
                            />
                        </Box>
                        : <BootstrapTooltip placement='top' title="Due Date">
                            <IconButton disabled={isDisabledEditSprint} disableRipple onClick={() => setShowModalDueDate(true)} sx={{ margin: '0 15px' }} className='btn-open-date-picker'><DueDatePicker /></IconButton>
                        </BootstrapTooltip>

                }

                {
                    showModalDueDate
                    && <DatePicker
                        value={dueDate}
                        format='MMM dd yyyy, HH:mmaa'
                        open
                        onClose={() => setShowModalDueDate(false)}
                        onChange={(newValue) => handleChangeDueDate(newValue)}
                        container={() => document.querySelector(".due-date-picker")}
                        className='picker-due-date-rsuite'

                    />
                }
            </Box>
        </Box>
    );
}

export default CustomDateTimePicker;