import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField } from "@mui/material";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { ReactNode } from "react";

interface AddNoteDialogProps {
    open: boolean;
    title?: ReactNode;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    noteLength?: number
}


const ConfNoteDialog: React.FC<AddNoteDialogProps> = ({
    open,
    title = (
        <>
            <span className="text-en font-gotham-light">Add Note</span>
            <span className="text-zh"> 新增備註</span>
        </>
    ),
    onClose,
    onConfirm,
    cancelText = "CANCEL",
    confirmText = "SAVE",
    ...props
}) => {
    const { register, errors, noteLength = 0 } = props;

    return (
        <Dialog open={open} onClose={onClose} className="note-dialog">
            <DialogTitle className="dialog-title">{title}</DialogTitle>
            <DialogContent>
                <TextField
                    {...register("note")}
                    id="outlined-required"
                    className="width100 m-t-8 note"
                    type="text"
                    placeholder="Note 備註"
                    multiline
                    rows={9}
                    error={!!errors.note}
                    helperText={typeof errors.note?.message === 'string' ? errors.note?.message : undefined} />
                <p
                    className="note-alert"
                    style={{ color: "#000007" }}
                >
                    {noteLength > 200
                        ?
                        <>
                            <p className="text-en font-gotham-light">Maximum character limit exceeded {noteLength}/200.</p>
                            <p className="text-zh">已超過字數上限 {noteLength}/200。</p>
                        </>
                        :
                        <>
                            <p className="text-en font-gotham-light">Maximum character limit is 200.</p>
                            <p className="text-zh">最多200字。</p>
                        </>}
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} className="dialog-button glass-button font-gotham-light">
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} className="dialog-button glass-button glass-button-accent font-gotham-light">
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfNoteDialog;
