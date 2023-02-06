import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'settings-tabs',
    templateUrl: './settings-tabs.component.html',
    styleUrls: ['./settings-tabs.component.scss']
})
export class SettingsTabsComponent implements OnInit {


    activeTabIndex = 0;
    hostEvents: any;


    constructor(
        public activatedRoute: ActivatedRoute

    ) {

    }

    async ngOnInit() {
        this.activeTabIndex = 0;
    }

    tabClick(e) {
        this.activeTabIndex = e.index;
    }

}