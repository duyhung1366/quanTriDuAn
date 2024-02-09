import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import React, { useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { ICreateProjectArgs } from "../../../../common/models/project";
import { useProject } from "../../hooks/useProject";
import './CreateOrUpdateProjectPopup.scss';
import { CKEditor } from 'ckeditor4-react';
import { Box, IconButton } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";

export interface IProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: ICreateProjectArgs) => Promise<void>;
  dataUpdate?: any;
  onUpdate?: any;
}
export type FormValues = ICreateProjectArgs;

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
export const CreateOrUpdateProjectPopup = (props: IProps) => {
  const { dataUpdate } = props;
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver });
  const [loading, setLoading] = React.useState(false);
  const [descriptionProject, setDescriptionProject] = useState(props.dataUpdate);
  const { currentUser } = useProject({});

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const mapData: ICreateProjectArgs = {
      ...data,
      description: descriptionProject,
      ownerId: currentUser._id
    }
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

  return (
    <Dialog className='dialog-create-project'
      classes={{ paper: 'paper-dialog-create-project' }}
      open={props.open} onClose={() => { props.onClose() }}
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ height: '100%' }}>
        <DialogTitle className='dialog-project-title'>
          {
            dataUpdate
              ? "Edit Project"
              : "Create new Project"
          }
          <IconButton
            onClick={() => props.onClose()}
            className="btn-close-dialog-project"
          >
            <CloseIcon className="iconclose-title-project" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ padding: '0 40px 0 40px', marginTop: '10px' }}>

          <label className="label-input">Project name</label>
          <Box className="container-name-project">
            <div className="dot-color-project" />
            <TextField
              sx={{ fontSize: '18px', margin: '5px 0 20px 0' }}
              disabled={loading}
              defaultValue={dataUpdate?.name}
              className='textfield-name-project'
              autoFocus
              variant="outlined"
              placeholder="Enter project name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(onSubmit)()
                  e.preventDefault()
                }
              }}
              id="name"
              type="text"
              fullWidth
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name && errors.name.message}
            />
          </Box>
          <label className="label-input">Description</label>
          <Box className='description-project'>
            <CKEditor
              initData={dataUpdate?.description}
              onChange={(event) => {
                setDescriptionProject(event.editor.getData())
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

        </DialogContent>
        <DialogActions sx={{ margin: '30px 30px 15px 0' }}>
          <button className="btn-cancle-create-project" onClick={() => props.onClose()}>
            Cancel
          </button>
          <button className="btn-create-project" type='submit'>
            Save
          </button>
        </DialogActions>
      </form>
    </Dialog >
  );
}