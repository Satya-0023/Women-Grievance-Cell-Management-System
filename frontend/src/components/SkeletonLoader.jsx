import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = () => {
    // This new structure mimics the layout of a form page for a better UX.
    return (
        <div className="skeleton-wrapper">
            <div className="skeleton-title"></div>
            <div className="skeleton-block"></div>
            <div className="skeleton-line-long"></div>
            <div className="skeleton-line-short"></div>
            <div className="skeleton-line-long"></div>
            <div className="skeleton-button"></div>
        </div>
    );
};

export default SkeletonLoader;