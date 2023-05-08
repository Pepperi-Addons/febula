import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'settings-tabs',
    templateUrl: './settings-tabs.component.html',
    styleUrls: ['./settings-tabs.component.scss']
})
export class SettingsTabsComponent implements OnInit {


    currentTabIndex : 0 | 1 | 2 = 0;
    hostEvents: any;


    constructor(
        public activatedRoute: ActivatedRoute

    ) {

    }

    async ngOnInit() {
    }

    onTabChange($event) {
        this.currentTabIndex = $event.index;
    }

}