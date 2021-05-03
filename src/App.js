import React, { useState, useCallback, useEffect } from "react";
import ImageMapper from "react-image-mapper";
import { Picky } from "react-picky";
import "react-picky/dist/picky.css"; // Include CSS

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import axios from "axios";
import Form from "react-bootstrap/Form";

import "./styles.css";

export default function App() {
  const [query, setQuery] = useState(1);

  const [mapAreas, setMapAreas] = useState({
    name: "my-map",
    areas: [
      {
        id: 5,
        shape: "circle",
        coords: [170, 100, 0],
        preFillColor: "rgba(255, 255, 255, 0)",
        strokeColor: "rgba(255, 255, 255, 0)",
        lineWidth: 0,
      },
    ],
  });
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
    setComment("");
    setImageClick(false);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const [pickyOptions, setPickyOptions] = React.useState();
  // const getTipPosition = area => {
  //   const obj = { top: `${area.center[1]}px`, left: `${area.center[0]}px` };

  // };

  const handleUpdateMapArea = useCallback(
    (evt) => {
      updateMapArea(5, [evt.nativeEvent.layerX, evt.nativeEvent.layerY, 10]);
      setImageClick(true);
      setComment("");
    },

    []
  );

  /**
   * Update image area when updated
   *
   * @see https://github.com/coldiary/react-image-mapper/issues/32
   */

  const url = "http://192.168.0.111:5000/";
  const loadOptionsFromServer = useCallback(async () => {
    let response = await fetch(url+"getAllPhotos");
    response = await response.json();
    setPickyOptions(response.photoArr);
  }, [pickyOptions]);
  useEffect(() => {
    loadOptionsFromServer();
  }, []);

  const changeOptionsFromServer = useCallback(
    async (x) => {
      try {
        let response = await fetch(
          url+"getComments/" + x.value
        );
        response = await response.json();
        setImageData(response);

        console.log(response, "imageData");
      } catch {
        console.log("empty pickyValue");
      }
    },
    [imageData]
  );
  useEffect(() => {
    changeOptionsFromServer();
  }, []);

  const saveComment = useCallback(
    async (comments, cordX, cordY, imagedata) => {
      console.log(comments, cordX, cordY, imagedata, "above try");

      try {
        let requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cordX: cordX,
            cordY,
            comment: comments,
            photoId: imagedata.imageDetails._id,
          }),
        };
        let response = await fetch(
          url+"createComment",
          requestOptions
        );
        response = await response.json();
        changeOptionsFromServer({ value: imagedata.imageDetails._id });
      } catch (e) {
        console.log(e, imageData, "imagedata catch");
      }
    },
    [imageData]
  );
  useEffect(() => {
    saveComment();
  }, []);

  const [comment, setComment] = React.useState("");
  const [buttonId, setButtonId] = React.useState(0);
  const [pickyValue, setPickyValue] = React.useState();
  const [imageData, setImageData] = React.useState(0);
  const submitCall = (comment, cordsX, cordY, imagedata) => {
    saveComment(comment, cordsX, cordY, imagedata);
    setButtonId(1);
    setComment("");
    setImageClick(false);
  };

  const changeComment = (e) => {
    console.log(e.target.value, "new Comment");
    setComment(e.target.value);
  };
  const [cords, setCords] = React.useState([]);
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();

  const updateMapArea = (id, coords) => {
    setCords(coords);
    const areas = mapAreas.areas.map((item) =>
      item.id === id ? { ...item, coords } : item
    );
    setMapAreas({
      name: mapAreas.name,
      areas,
    });
  };
  const [commentArray, setCommentArray] = React.useState([]);
  const [imageClick, setImageClick] = React.useState(false);

  return (
    <div className="App">
      {imageData == 0 ? null : (
        <ImageMapper
          src={imageData.imageDetails.url}
          //onClick={area => getTipPosition(area)}
          onImageClick={handleUpdateMapArea}
          map={mapAreas}
          width={500}
          height={400}
        />
      )}
      <Picky
        id="picky"
        // options={[{label:"image 1",value:1},{label:"image 2",value:2},{label:"image 3",value:3}]}
        options={pickyOptions}
        keepOpen={false}
        value={pickyValue}
        multiple={false}
        valueKey="value"
        labelKey="label"
        includeSelectAll={false}
        includeFilter={true}
        onChange={(values) => {
          setPickyValue(values);
          changeOptionsFromServer(values);
        }}
        dropdownHeight={600}
      />
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        disableBackdropClick={true}
      >
        <DialogContent>
          Please find comments below:
          <ul>
            {commentArray.map((i) => (
              <li>{i}</li>
            ))}
          </ul>
          <Form>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows="10"
                placeholder="Enter a new comment here"
                onChange={(event) => {
                  setComment(event.target.value);
                }}
              />
            </Form.Group>
          </Form>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              handleClose();
              setComment("");
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              submitCall(comment, x, y, imageData);
              handleClose();
            }}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {imageData.commentDetails != null && imageData.commentDetails.length > 0
        ? imageData.commentDetails.map((i) => (
            <button
              style={{
                background: "red",
                width: "10px",
                height: "10px",
                borderRadius: "5px",
                position: "absolute",
                top: `${i.cordY}px`,
                left: `${i.cordX}px`,
                zIndex: "1000",
              }}
              onClickCapture={() => {
                setCommentArray(i.comments);
                handleClickOpen();
                setX(i.cordX);
                setY(i.cordY);
              }}
            ></button>
          ))
        : null}
      <form>
        <input
          type="text"
          style={
            imageClick
              ? {
                  position: "absolute",
                  top: mapAreas.areas[0].coords[1],
                  left: mapAreas.areas[0].coords[0],
                  zIndex: "10000",
                }
              : {
                  display: "none",
                }
          }
          onChange={(e) => changeComment(e)}
          value={comment}
        ></input>
        {/* {mapAreas.areas[0].coords[0]},{mapAreas.areas[0].coords[1]},{mapAreas.areas[0].coords[2]}> */}
      </form>

      <button
        disabled={comment == "" ? true : false}
        id = {comment !== "" && imageClick? "submit":"submit-disable"}
        onClick={() => {
          submitCall(comment, cords[0], cords[1], imageData);
        }}
      >
        Submit
      </button>
      {/* <pre>On each click, circle should be position of the clicked at {mapAreas.areas}</pre> */}
    </div>
  );
}
