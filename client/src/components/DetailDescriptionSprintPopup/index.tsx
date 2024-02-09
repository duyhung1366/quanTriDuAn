

import { Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { RootState } from "../../redux/store";

export const DetailDescriptionSprintPopup = (props: { open: boolean, onClose: () => void }) => {

    const { open, onClose } = props
    const currentSprint = useAppSelector((state: RootState) => state.sprintReducer.currentSprint)

    return (
        <Dialog className="Dialog-create-sprint" open={open} onClose={() => onClose()}>
            <label style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center' }}>{currentSprint?.name}</label>
            <div dangerouslySetInnerHTML={{ __html: currentSprint?.description }} />
        </Dialog>
    );
}