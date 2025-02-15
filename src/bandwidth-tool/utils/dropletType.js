/*
Copyright 2022 DigitalOcean

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const dropletData = [
    {
        regex: /^s-\d+vcpu-\d+(gb|mb)(-\d+gb)?$/,
        type: 'Basic',
        variant: 'Regular',
    },
    {
        regex: /^s-\d+vcpu-\d+gb-intel$/,
        type: 'Basic',
        variant: 'Premium Intel',
    },
    {
        regex: /^s-\d+vcpu-\d+gb-amd$/,
        type: 'Basic',
        variant: 'Premium AMD',
    },
    {
        regex: /^g-.*$/,
        type: 'General Purpose',
        variant: '1x SSD',
    },
    {
        regex: /^gd-.*$/,
        type: 'General Purpose',
        variant: '2x SSD',
    },
    {
        regex: /^c-.*$/,
        type: 'CPU-Optimized',
        variant: '1x SSD',
    },
    {
        regex: /^c2-.*$/,
        type: 'CPU-Optimized',
        variant: '2x SSD',
    },
    {
        regex: /^m-.*$/,
        type: 'Memory-Optimized',
        variant: '1x SSD',
    },
    {
        regex: /^m3-.*$/,
        type: 'Memory-Optimized',
        variant: '3x SSD',
    },
    {
        regex: /^m6-.*$/,
        type: 'Memory-Optimized',
        variant: '6x SSD',
    },
    {
        regex: /^so-.*$/,
        type: 'Storage-Optimized',
        variant: '1x SSD',
    },
    {
        regex: /^so1_5-.*$/,
        type: 'Storage-Optimized',
        variant: '1.5x SSD',
    },
];

export const dropletTypes = ['Basic', 'General Purpose', 'CPU-Optimized', 'Memory-Optimized', 'Storage-Optimized', 'Legacy'];

export const dropletType = slug => {
    const match = dropletData.find(data => slug.match(data.regex));
    return match && match.type || 'Legacy';
};

export const dropletVariant = slug => {
    const match = dropletData.find(data => slug.match(data.regex));
    return match && match.variant || null;
};
