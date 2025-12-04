import { useEffect } from 'react';

// 지도 컨트롤 컴포넌트
function MapController({ map, selectedRunner }) {
    useEffect(() => {
        if (selectedRunner && map) {
            map.panTo(selectedRunner.position);
            map.setZoom(15);
        }
    }, [selectedRunner, map]);

    return null;
}

export default MapController;
