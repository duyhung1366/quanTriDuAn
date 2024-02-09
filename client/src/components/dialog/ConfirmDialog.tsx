import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { PropsWithoutRef, ReactNode } from "react";
import { DialogTransitionDown } from "./DialogTransitions";

const ConfirmDialog = (props: PropsWithoutRef<{
  open: boolean;
  onClose?: (e) => void;
  onConfirm?: (e) => void;
  title?: string;
  content?: ReactNode;
}>) => {
  const {
    open,
    onClose,
    onConfirm = () => {},
    title = "",
    content = <></>
  } = props;
  return <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    TransitionComponent={DialogTransitionDown}
  >
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{content}</DialogContent>
    <DialogActions>
      <Button variant="contained" color="primary" onClick={onConfirm}>Yes</Button>
      <Button variant="contained" color="error" onClick={onClose}>No</Button>
    </DialogActions>
  </Dialog>
}

export default ConfirmDialog;