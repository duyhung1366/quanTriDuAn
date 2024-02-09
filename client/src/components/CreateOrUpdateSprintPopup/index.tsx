import { Grid, Divider } from "@mui/material";
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import React, { useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { SprintStatus } from "../../../../common/constants";
import { CreateSprintArgs } from "../../../../common/models/sprint";
import './CreateOrUpdateSprintPopup.scss';
import { CKEditor } from 'ckeditor4-react';
import { DatePicker } from "@mui/x-date-pickers";
import { debounce } from "lodash";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DueDatePicker from "../icons/DueDatePicker";
import CalenderDatePicker from "../icons/CalenderDatePicker";
import { IconButton } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";


interface IProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: CreateSprintArgs) => void;
  nameSprint: string;
  dataUpdate?: any;
  onUpdate?: any;
}

type FormValues = {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  parentId?: string;
  projectId: string;
  status: number;
};

const resolver: Resolver<FormValues> = async (values: FormValues) => {
  return {
    values: values.name ? values : {},
    errors: !values.name
      ? {
        name: {
          type: 'required',
          message: 'Name field is required.',
        },
      }
      : {},
  };
};
// const decentralizationProject = async () => {

// };
export const CreateOrUpdateSprintPopup = (props: IProps) => {
  const { dataUpdate } = props;

  const URL = `${process.env.REACT_APP_ENDPOINT}/${process.env.REACT_APP_PREFIX_API}`
  const [description, setDescription] = useState()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(dataUpdate?.startDate ?? null);
  const [dueDate, setDueDate] = useState(dataUpdate?.endDate ?? null);
  const [status, setStatus] = useState(dataUpdate?.status ?? SprintStatus.UP_COMING);
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const mapData: CreateSprintArgs = {
      ...data,
      description: description,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(dueDate).getTime(),
      status,
      projectId: '',
    };
    if (!dataUpdate) {
      try {
        await props.onCreate(mapData);
        setLoading(false);
      } catch (_error) {
        setLoading(false);
      }
    }
    else {
      try {
        await props.onUpdate(mapData);
        setLoading(false);
      } catch (_error) {
        setLoading(false);
      }
    }
  }
  const handleChangeStartDate = debounce((newValue: any) => {
    const startDate = newValue?.$d.getTime()
    if (!startDate) {
      return;
    }
    setStartDate(startDate);
  }, 500)
  const handleChangeDueDate = debounce((newValue: any) => {
    const dueDate = newValue?.$d?.getTime()
    if (!dueDate) {
      return;
    }
    if (startDate > dueDate) {
      return;
    }
    setDueDate(dueDate)
  }, 500)
  const handleChangeStatus = (event: any) => {
    setStatus(event.target.value)
  }

  return (

    <Dialog disableAutoFocus className="dialog-create-sprint" open={props.open} onClose={() => { !loading && props.onClose() }} classes={{
      paper: "dialog-create-sprint-paper"
    }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ height: '100%' }}>
        <DialogTitle className="title-model-sprint">
          <Box className="name-title-model-sprint">
            {
              !dataUpdate
                ? "Create new sprint"
                : `Updated sprint : ${props.nameSprint}`
            }
          </Box>
          <IconButton
            onClick={() => props.onClose()}
            className="btn-close-model-sprint"
          >
            <CloseIcon className="iconclose-title-model-sprint" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="dialog-content-popup-sprint" sx={{ padding: '0 40px 0 40px' }}  >
          {
            !dataUpdate && <Box className="name-project-model-sprint">Project : {props.nameSprint}</Box>
          }
          <label style={{ fontSize: '16px', fontWeight: 600 }}>Sprint name</label>
          <Box className="container-name-sprint">
            <div className="dot-color-project" />
            <TextField
              sx={{ fontSize: '18px', margin: '5px 0 20px 0' }}
              className="textfield-name-sprint"
              disabled={loading}
              autoFocus
              margin="dense"
              type="text"
              fullWidth
              placeholder="Enter sprint name"
              variant="outlined"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSubmit(onSubmit)()
                }
              }}
              {...register("name")}
              error={!!errors.name}
              defaultValue={dataUpdate?.name}
              helperText={errors.name && errors.name.message}
            />
          </Box>
          <label style={{ fontSize: '16px', fontWeight: 600 }}>Description</label>
          <Box className="description-model-sprint">
            <CKEditor
              initData={dataUpdate?.description}
              onChange={(event) => {
                setDescription(event.editor.getData())
              }}
              config={{
                filebrowserImageUploadUrl: `${URL}/upload-image-ckeditor`,
                uploadUrl: `${URL}/upload-image-ckeditor`,
                extraPlugins: 'autogrow',
              }}
              style={{
                overflowY: 'auto',
                maxHeight: '320px',
              }}
            />
          </Box>
          <Box className="group-select-sprint-model">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                className="input-date-sprint"
                label="Start Date"
                inputFormat="DD/MM/YYYY"
                components={{
                  OpenPickerIcon: CalenderDatePicker,
                }}
                InputProps={{
                  style: {
                    height: '45px',
                    width: '200px'
                  },
                }}
                value={startDate}
                onChange={handleChangeStartDate}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
            <Box sx={{ marginLeft: '20px' }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  className="input-date-sprint"
                  label="Due Date"
                  inputFormat="DD/MM/YYYY"
                  components={{
                    OpenPickerIcon: DueDatePicker,

                  }}
                  InputProps={{
                    style: {
                      height: '45px',
                      width: '200px',
                    },
                  }}
                  value={dueDate}
                  onChange={handleChangeDueDate}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </Box>

            <Box className="select-status-sprint">
              <FormControl fullWidth>
                <InputLabel id="select-status-sprint">Status</InputLabel>
                <Select
                  labelId="select-status-sprint"
                  value={status}
                  label="Status"
                  style={{ height: "45px" }}
                  onChange={handleChangeStatus}
                >
                  <MenuItem value={SprintStatus.ARCHIVED}>Archive</MenuItem>
                  <MenuItem value={SprintStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={SprintStatus.UP_COMING}>Up coming</MenuItem>
                </Select>

              </FormControl>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '0 20px 30px 0', marginTop: '30px' }}>
          <button className="btn-cancle-updateOrcreate" onClick={() => props.onClose()}>Cancel</button>
          {
            (!dataUpdate)
            &&
            <button
              className="btn-save-sprint"
              type="submit"
            >
              Create
            </button>
          }
          {
            (dataUpdate)
            &&
            <button
              className="btn-save-sprint"
              type="submit"
            >
              Update
            </button>
          }

        </DialogActions>
      </form>
    </Dialog>


  );
}