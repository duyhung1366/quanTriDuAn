// import randomcolor from "randomcolor/package.json"
import * as React from 'react';
export const ColorProject = ({ color }) => {

    return (
        <div style={{
            width: "10px",
            height: "10px",
            borderRadius: '5px',
            marginRight: '15px',
            background: `${color}`,
            padding: '0 5px'
        }}
        />


    );
}