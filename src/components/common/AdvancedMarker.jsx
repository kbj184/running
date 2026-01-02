import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Custom wrapper for Google Maps AdvancedMarkerElement
 * Note: Requires 'marker' library in useJsApiLoader and mapId in GoogleMap options.
 */
const AdvancedMarker = ({ map, position, onClick, children, title, zIndex }) => {
    const [contentDiv] = useState(() => document.createElement('div'));
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map || !window.google || !window.google.maps.marker) return;

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
            map,
            content: children ? contentDiv : null,
            title: title || '',
            zIndex: zIndex || 0,
        });

        if (onClick) {
            marker.addListener('click', onClick);
        }

        markerRef.current = marker;

        return () => {
            if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
            }
        };
    }, [map, contentDiv]);

    useEffect(() => {
        if (markerRef.current && position) {
            markerRef.current.position = position;
        }
    }, [position]);

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.title = title || '';
            markerRef.current.zIndex = zIndex || 0;
        }
    }, [title, zIndex]);

    // Render children into the contentDiv using a Portal
    return children ? createPortal(children, contentDiv) : null;
};

export default AdvancedMarker;
