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
        if (!map || !position || !window.google) return;

        // Ensure the marker library is loaded
        if (!window.google.maps.marker || !window.google.maps.marker.AdvancedMarkerElement) {
            console.warn('AdvancedMarkerElement not found. Checking if "marker" library is correctly loaded...');
            return;
        }

        // Create the advanced marker
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
            map,
            position,
            title: title || '',
            zIndex: zIndex || 0,
            content: children ? contentDiv : null
        });

        if (onClick) {
            marker.addListener('click', onClick);
        }

        markerRef.current = marker;

        return () => {
            if (marker) {
                marker.map = null;
            }
        };
    }, [map, position, title, zIndex, onClick, children, contentDiv]);

    // Render children into the contentDiv using a Portal
    return children ? createPortal(children, contentDiv) : null;
};

export default AdvancedMarker;
