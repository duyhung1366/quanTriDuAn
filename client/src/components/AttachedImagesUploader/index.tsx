import Cancel from "@mui/icons-material/Cancel";
import { Button, IconButton } from "@mui/material";
import axios from "axios";
import { Fragment, PropsWithoutRef } from "react";
import ReactImageUploading, { ImageListType } from "react-images-uploading";
import { useAppSelector } from "../../redux/hooks";
import ZoomAttachedImage from "../ZoomAttachedImage";
import ImgUploadIcon from "./ImgUploadIcon";
import "./style.scss";
import { useState } from "react";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ConfirmDialog from "../dialog/ConfirmDialog";

/** Controlled, TODO: Uncontrolled */
const AttachedImagesUploader = (
  props: PropsWithoutRef<{
    apiEndpoint?: string;
    maxImages?: number;
    images?: ImageListType;
    isDisabled?: boolean;
    onChange?: (imageList: ImageListType) => void;
    onRemove?: (image: string, index: number) => void;
  }>
) => {
  const {
    apiEndpoint,
    images,
    maxImages,
    isDisabled,
    onChange = () => { },
    onRemove = () => { },
  } = props;

  const accessToken = useAppSelector((state) => state.authReducer.accessToken);
  const [openZoomImage, setOpenZoomImage] = useState(false);
  const [checkIndexImage, setCheckIndexImage] = useState<number>();
  const [indexImageDelete, setIndexImageDelete] = useState(-1);

  const handleOpenZoomImage = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    setOpenZoomImage(true);
    setCheckIndexImage(index);
  };
  const handleCloseZoomImage = () => {
    setOpenZoomImage(false);
  };
  const handleDeleteImage = (i: number) => {
    setIndexImageDelete(i)
  }
  const handleImageUpload = async (
    imageList: ImageListType,
    addOrUpdateIndex?: number[]
  ) => {
    await Promise.all(
      imageList.map(async (image, i) => {
        if (addOrUpdateIndex?.includes(i) ?? false) {
          if (!apiEndpoint) return "";
          const formData = new FormData();
          formData.append(
            "upload",
            image.file,
            `image-content-${image.file.name}`
          );
          try {
            const { data, status } = await axios.post(
              `${apiEndpoint}/upload-image-ckeditor`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            if (status !== 200) {
              return "";
            }
            imageList[i].dataURL = data?.url;
            return data?.url;
          } catch (error) {
            console.error(error);
            return "";
          }
        }
      })
    );
    onChange(imageList);
    setOpenZoomImage(false);
  };
  return (
    <ReactImageUploading
      multiple
      maxNumber={maxImages}
      value={images}
      onChange={handleImageUpload}>
      {({ onImageUpload, onImageRemove, dragProps }) => (
        <div className="upload__image-wrapper">
          {images &&
            images.length > 0 &&
            images.map((img, i) => {
              return (
                <div key={i} className="image-item-container">
                  <ZoomAttachedImage
                    open={openZoomImage && checkIndexImage === i}
                    handleClose={handleCloseZoomImage}
                    i={i}
                    onImageRemove={onImageRemove}
                    images={images}
                  />
                  <div
                    className="image-item"
                    onClick={(e) => handleOpenZoomImage(e, i)}>
                    <img src={img.dataURL} alt={img.dataURL} width="100" />
                  </div>
                  <div
                    className="custom-image-item"
                    onClick={(e) => handleOpenZoomImage(e, i)}>
                    <RemoveRedEyeOutlinedIcon className="icon-view-image-task" />
                    <Button
                      disabled={isDisabled}
                      onClick={(e) => {
                        handleDeleteImage(i);
                        e.stopPropagation();
                      }}
                      className="image-item-remove-button"
                      fullWidth>
                      <DeleteOutlineIcon />
                    </Button>
                  </div>
                  <span className="image-index-label">Ảnh {i + 1}</span>
                </div>
              );
            })}
          <div className="image-item-wrapper">
            <div
              {...dragProps}
              className="add-item-button"
              onClick={onImageUpload}>
              <ImgUploadIcon />
              Tải ảnh lên
            </div>
          </div>
          <ConfirmDialog
            open={indexImageDelete !== -1}
            title="Confirm Delete?"
            content={<>Are you sure to delete image  ?</>}
            onClose={() => {
              setIndexImageDelete(-1)
            }}
            onConfirm={() => {
              onImageRemove(indexImageDelete)
              setIndexImageDelete(-1)
            }}
          />
        </div>

      )}
    </ReactImageUploading>
  );
};

export default AttachedImagesUploader;
