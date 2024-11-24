import { useEffect, useRef } from "react";

export default function VideoPlayer({ stream }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }

        // Cleanup on unmount
        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [stream]); // Include `stream` as a dependency

    return (
        <div >

            <video ref={videoRef} autoPlay style={{width:'530px'}} />
        </div>
    );
}
