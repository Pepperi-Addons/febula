import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { FomoService } from 'src/services/fomo.service';
import { FilterObject, FilterRule } from '../../../../../shared/types';
import { Collection } from '@pepperi-addons/papi-sdk/dist/entities';

@Component({
    selector: 'settings-tabs',
    templateUrl: './settings-tabs.component.html',
    styleUrls: ['./settings-tabs.component.scss']
})
export class SettingsTabsComponent implements OnInit {


    currentTabIndex : 0 | 1 | 2 = 0;
    hostEvents: any;
    fomoService: FomoService;
    filterObjects: FilterObject[] = [];
    resources: Collection[] = [];
    filterRules: FilterRule[] = [];
    filterKeyToNameMap: Map<string, string> = new Map<string, string>();


    constructor(
        public activatedRoute: ActivatedRoute,
        public pepAddonService: PepAddonService

    ) {
        this.fomoService = new FomoService(this.pepAddonService);
    }

    async ngOnInit() {
        // update data
        await Promise.all([
            await this.updateFilterObjects(),
            await this.updateResources(),
            await this.updateFilterRules()
        ]);
    }

    private async updateFilterObjects() {
        this.filterObjects = await this.fomoService.getFilterObjects();
    }

    private async updateResources() {
        this.resources = await this.fomoService.getResources();
    }
    
    private updateFilterKeyToNameMap(filterObjects: FilterObject[]) {
        filterObjects.forEach(filterObject => {
            this.filterKeyToNameMap.set(filterObject.Key, filterObject.Name);
        });
    }

    private async updateFilterObjectNames(keyList: string[]) {
        const filterObjects = await this.fomoService.getFilterObjectsByKeys(keyList);
        this.updateFilterKeyToNameMap(filterObjects);
    }

    private async updateFilterRules() {
        this.filterRules = await this.fomoService.getFilterRules();
        const keyList = this.filterRules.map(filterRule => filterRule.Filter);
        const uniqueKeys = Array.from(new Set(keyList));
        await this.updateFilterObjectNames(uniqueKeys);
    }
    

    async onFilterObjectChange($event) { 
        await this.updateFilterObjects();
    }

    async onFilterRuleChange($event) { 
        await this.updateFilterRules()
    }

    onTabChange($event) {
        this.currentTabIndex = $event.index;
    }

}