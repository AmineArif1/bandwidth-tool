<!--
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
-->

<template>
    <div class="all do-bulma">
        <div class="container inset">
            <div class="container">
                <div class="panel bandwidth">
                    <h1>{{ i18n.templates.app.title }}</h1>
                    <h3>
                        <small>
                            {{ i18n.templates.app.description }}
                            {{ i18n.templates.app.forMoreInfo }}
                            <a href="https://www.digitalocean.com/docs/accounts/billing/bandwidth/">
                                {{ i18n.templates.app.docs }}</a>.
                        </small>
                    </h3>

                    <Pool
                        :bandwidth-allowance="bandwidthAllowance"
                        :bandwidth-allowance-data="bandwidthAllowanceData"
                        :bandwidth-consumption="bandwidthConsumption"
                        :bandwidth-consumption-data="bandwidthConsumptionData"
                        :bandwidth-overage="bandwidthOverage"
                        :focused-droplet-class="focusedDropletClass"
                        :focused-droplet-enter="focusedDropletEnter"
                        :focused-droplet-leave="focusedDropletLeave"
                    ></Pool>

                    <div class="droplets">
                        <h2>{{ i18n.templates.app.droplets }}</h2>
                        <div v-if="hasActiveDroplets">
                            <div class="panel-list panel-list-vertical">
                                <ActiveDroplet
                                    v-for="(droplet, id) in activeDroplets"
                                    :key="id"
                                    ref="activeDroplets"
                                    :droplet="droplet[0]"
                                    :type="droplet[1]"
                                    :class="focusedDropletClass(id)"
                                    :overage="bandwidthOverage !== 0"
                                    @mouseenter.native="focusedDropletEnter(id)"
                                    @mouseleave.native="focusedDropletLeave(id)"
                                    @remove="removed(id)"
                                    @update="update"
                                ></ActiveDroplet>
                            </div>
                        </div>
                        <div v-else>
                            <p class="has-text-muted">
                                {{ i18n.templates.app.selectToStart }}
                            </p>
                            <div class="panel-list panel-list-vertical">
                                <SkeletonDroplet></SkeletonDroplet>
                            </div>
                        </div>

                        <Costs
                            ref="costs"
                            :bandwidth-consumption="bandwidthConsumption"
                            :droplet-cost="dropletCost"
                            :bandwidth-overage="bandwidthOverage"
                            :active-droplets="$refs.activeDroplets"
                            :style="{ display: hasActiveDroplets ? undefined : 'none' }"
                            @update="update"
                        ></Costs>
                    </div>

                    <Picker :droplets="droplets" @picked="picked"></Picker>
                </div>
            </div>
        </div>

        <FAQs></FAQs>

        <Footer :text="i18n.templates.app.oss"></Footer>
    </div>
</template>

<script>
    import queryString from 'query-string';

    import i18n from '../i18n';
    import compareArrays from '../utils/compareArrays';
    import { dropletType, dropletVariant } from '../utils/dropletType';
    import dropletData from '../../build/droplets';

    import Footer from 'do-vue/src/templates/footer';
    import Pool from './pool';
    import ActiveDroplet from './droplets/active_droplet';
    import SkeletonDroplet from './droplets/skeleton_droplet';
    import Costs from './costs';
    import Picker from './picker';
    import FAQs from './faqs';

    // Build the Droplet data
    const droplets = {};
    for (const droplet of dropletData) {
        if (!droplet.available || !droplet.regions.length) continue;
        const type = dropletType(droplet.slug);
        if (!type) continue;
        if (!(type in droplets)) droplets[type] = [];
        droplet.type = type;
        droplet.variant = dropletVariant(droplet.slug);
        droplets[type].push(droplet);
    }

    export default {
        name: 'App',
        components: {
            Footer,
            Pool,
            ActiveDroplet,
            SkeletonDroplet,
            Costs,
            Picker,
            FAQs,
        },
        data() {
            return {
                i18n,
                droplets,
                activeDroplets: {},
                hasActiveDroplets: false,
                bandwidthAllowance: 0,
                bandwidthAllowanceData: [],
                bandwidthConsumption: 0,
                bandwidthConsumptionData: [],
                bandwidthOverage: 0,
                dropletCost: 0,
                focusedDroplet: null,
            };
        },
        mounted() {
            this.load();
        },
        methods: {
            /**
             * URL loading logic
             */

            safeActive(raw) {
                try {
                    if (!raw) return [];
                    if (!raw.length) return [];
                    const data = JSON.parse(raw);
                    if (!data) return [];
                    if (!Array.isArray(data)) return [];
                    return data;
                } catch (_) {
                    return [];
                }
            },
            safeAdditional(raw) {
                try {
                    if (!raw) return 0;
                    const data = parseInt(raw, 10);
                    if (isNaN(data)) return 0;
                    if (data < 0) return 0;
                    return data;
                } catch (_) {
                    return 0;
                }
            },
            get() {
                const parsed = queryString.parse(window.location.search);
                return { active: this.safeActive(parsed.active), additional: this.safeAdditional(parsed.additional) };
            },
            load() {
                // Get the old data
                const data = this.get();

                // If no data, add a default demo Droplet
                if (!data.active.length) data.active.push({
                    slug: 's-1vcpu-2gb',
                    type: 'droplet',
                    hours: 722,
                    consumption: 1500,
                    nodes: 1,
                });

                // Work through the initial droplets and load them in the tool
                for (const item of data.active) {
                    // Insert as a new active droplet
                    const droplet = dropletData.filter(d => d.slug === item.slug);
                    if (!droplet) continue;
                    const keys = Object.keys(this.$data.activeDroplets).map(x => parseInt(x));
                    const id = keys.length ? Math.max(...keys) + 1 : 0;
                    this.$data.activeDroplets[id] = [droplet[0], item.type];
                    this.$data.hasActiveDroplets = !!Object.keys(this.$data.activeDroplets).length;

                    // Once rendered, set the data in the ref
                    this.$nextTick(() => {
                        const ref = this.$refs.activeDroplets.filter(d => d.$.vnode.key === id.toString());
                        if (!ref) return;
                        ref[0].$data.hours = item.hours;
                        ref[0].$data.consumption = item.consumption;
                        ref[0].$data.nodes = item.nodes;
                    });
                }

                // Handle additional
                this.$refs.costs.$data.additionalBandwidthConsumption = data.additional;

                // Update a tick after the initial data is set in the refs
                this.$nextTick(() => {
                    this.$nextTick(this.update);
                });
            },

            /**
             * URL saving logic
             */

            save() {
                // Get the new data to save
                if (!this.$refs.activeDroplets) return;
                const data = this.$refs.activeDroplets.map(ref => {
                    return {
                        slug: ref.$props.droplet.slug,
                        type: ref.$props.type,
                        hours: ref.$data.hours,
                        consumption: ref.$data.consumption,
                        nodes: ref.$data.nodes,
                    };
                });

                // Get the old data, check if changed droplets
                const last = this.get();
                const sameDroplets = compareArrays(data.map(x => x.slug), last.active.map(x => x.slug));

                // Create new query param
                const parsed = queryString.parse(window.location.search);
                parsed.active = JSON.stringify(data);
                parsed.additional = this.$refs.costs.$data.additionalBandwidthConsumption;

                // Save
                if (sameDroplets) {
                    // Changed hours/consumption - don't spam new history entries
                    window.history.replaceState({}, '', `?${queryString.stringify(parsed)}`);
                } else {
                    // Changed droplets - store a new history point
                    window.history.pushState({}, '', `?${queryString.stringify(parsed)}`);
                }
            },

            /**
             * Calculation & update logic
             */

            update() {
                // Calculate the totals
                this.$data.dropletCost = this.getDropletCost();
                this.$data.bandwidthAllowance = this.getBandwidthAllowance();
                this.$data.bandwidthConsumption = this.getBandwidthConsumption();
                this.$data.bandwidthOverage = Math.max(
                    (this.$data.bandwidthConsumption - this.$data.bandwidthAllowance),
                    0,
                );

                // Calculate the per Droplet stacks
                const barMaxWidth = Math.max(this.$data.bandwidthConsumption, this.$data.bandwidthAllowance);
                const newBandwidthAllowanceData = [];
                const newBandwidthConsumptionData = [];
                for (const droplet of (this.$refs.activeDroplets || [])) {
                    newBandwidthAllowanceData.push([
                        droplet.$.vnode.key,
                        `${droplet.bandwidthAllowance() / barMaxWidth * 100}%`,
                    ]);
                    newBandwidthConsumptionData.push([
                        droplet.$.vnode.key,
                        `${droplet.$data.consumption / barMaxWidth * 100}%`,
                    ]);
                }
                newBandwidthConsumptionData.push([
                    'additional',
                    `${this.$refs.costs.$data.additionalBandwidthConsumption / barMaxWidth * 100}%`,
                ]);

                // Filler bars
                if (!newBandwidthAllowanceData.length || this.$data.bandwidthAllowance === 0)
                    newBandwidthAllowanceData.push(['', '5px']);
                if (!newBandwidthConsumptionData.length || this.$data.bandwidthConsumption === 0)
                    newBandwidthConsumptionData.push(['', '5px']);

                // Save it all
                this.$data.bandwidthAllowanceData = newBandwidthAllowanceData;
                this.$data.bandwidthConsumptionData = newBandwidthConsumptionData;
                this.save();
            },
            removed(id) {
                delete this.$data.activeDroplets[id];
                this.$data.hasActiveDroplets = !!Object.keys(this.$data.activeDroplets).length;
                if (this.$data.focusedDroplet === id) this.$data.focusedDroplet = null;
                this.$nextTick(this.update);
            },
            picked(slug, type) {
                const droplet = dropletData.filter(d => d.slug === slug)[0];
                const keys = Object.keys(this.$data.activeDroplets).map(x => parseInt(x));
                const id = keys.length ? Math.max(...keys) + 1 : 0;
                this.$data.activeDroplets[id] = [droplet, type];
                this.$data.hasActiveDroplets = !!Object.keys(this.$data.activeDroplets).length;
                this.$nextTick(this.update);
            },
            getBandwidthAllowance() {
                if (!this.$refs.activeDroplets) return 0;
                return this.$refs.activeDroplets.reduce((total, val) => {
                    return total + val.bandwidthAllowance();
                }, 0);
            },
            getDropletBandwidthConsumption() {
                if (!this.$refs.activeDroplets) return 0;
                return this.$refs.activeDroplets.reduce((total, val) => {
                    return total + val.$data.consumption;
                }, 0);
            },
            getBandwidthConsumption() {
                return this.getDropletBandwidthConsumption() + this.$refs.costs.$data.additionalBandwidthConsumption;
            },
            getDropletCost() {
                if (!this.$refs.activeDroplets) return 0;
                return this.$refs.activeDroplets.reduce((total, val) => {
                    return total + val.dropletCost();
                }, 0);
            },
            focusedDropletLeave(id) {
                if (id === '') return;
                if (this.$data.focusedDroplet === id) this.$data.focusedDroplet = null;
            },
            focusedDropletEnter(id) {
                if (id === '') return;
                this.$data.focusedDroplet = id;
            },
            focusedDropletClass(id) {
                if (this.$data.focusedDroplet === null) return '';
                if (id === this.$data.focusedDroplet) return 'is-focused';
                return 'is-unfocused';
            },
        },
    };
</script>
