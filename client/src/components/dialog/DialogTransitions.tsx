import { Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { forwardRef, ReactElement, Ref } from "react";

export const DialogTransitionDown = forwardRef((props: TransitionProps & {
  children: ReactElement<any, any>;
}, ref: Ref<unknown>) => <Slide direction="down" ref={ref} {...props} />);

export const DialogTransitionUp = forwardRef((props: TransitionProps & {
  children: ReactElement<any, any>;
}, ref: Ref<unknown>) => <Slide direction="up" ref={ref} {...props} />);

export const DialogTransitionLeft = forwardRef((props: TransitionProps & {
  children: ReactElement<any, any>;
}, ref: Ref<unknown>) => <Slide direction="left" ref={ref} {...props} />);

export const DialogTransitionRight = forwardRef((props: TransitionProps & {
  children: ReactElement<any, any>;
}, ref: Ref<unknown>) => <Slide direction="right" ref={ref} {...props} />);