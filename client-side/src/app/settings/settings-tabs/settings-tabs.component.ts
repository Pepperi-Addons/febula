import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { FebulaService } from '../../../services/febula.service';
import { FilterObject, FilterRule } from '../../../../../shared/types';
import { Collection } from '@pepperi-addons/papi-sdk/dist/entities';

@Component({
    selector: 'settings-tabs',
    templateUrl: './settings-tabs.component.html',
    styleUrls: ['./settings-tabs.component.scss']
})
export class SettingsTabsComponent implements OnInit {

    currentTabIndex : 0 | 1 | 2 | 3 = 0;
    hostEvents: any;
    febulaService: FebulaService;
    filterObjects: FilterObject[] = [];
    resources: Collection[] = [];
    filterRules: FilterRule[] = [];
    filterKeyToNameMap: Map<string, string> = new Map<string, string>();

    constructor(
        public activatedRoute: ActivatedRoute,
        public pepAddonService: PepAddonService

    ) {
        this.febulaService = new FebulaService(this.pepAddonService);
    }

    async ngOnInit() {
        // update data
        await Promise.all([
            this.updateFilterObjects(),
            this.updateResources(),
            this.updateFilterRules()
        ]);
    }

    private async updateFilterObjects(): Promise<void> {
        this.filterObjects = await this.febulaService.getFilterObjects();
    }

    private async updateResources(): Promise<void> {
        this.resources = await this.febulaService.getResources();
    }

    private async updateFilterRules(): Promise<void> {
        this.filterRules = await this.febulaService.getFilterRules();
        const keyList = this.filterRules.map(filterRule => filterRule.Filter);
        const uniqueKeys = Array.from(new Set(keyList));
        await this.updateFilterObjectNames(uniqueKeys);
    }

    private async updateFilterObjectNames(keyList: string[]): Promise<void> {
        const filterObjects = await this.febulaService.getFilterObjectsByKeys(keyList);
        this.updateFilterKeyToNameMap(filterObjects);
    }   

    private updateFilterKeyToNameMap(filterObjects: FilterObject[]): void {
        filterObjects.forEach(filterObject => {
            this.filterKeyToNameMap.set(filterObject.Key, filterObject.Name);
        });
    }

    public async onFilterObjectChange(_$event: any): Promise<void> { 
        await this.updateFilterObjects();
    }

    public async onFilterRuleChange(_$event: any): Promise<void> { 
        await this.updateFilterRules()
    }

    public onTabChange($event: any): void {
        this.currentTabIndex = $event.index;
    }
}