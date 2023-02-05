import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';

import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';

import { IPepGenericListDataSource, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { FomoService } from "src/services/fomo.service";
import { FilterObject } from "../../../../../types";

@Component({
    selector: 'editor-list',
    templateUrl: './editor-list.component.html',
    styleUrls: ['./editor-list.component.scss']
})
export class EditorListComponent implements OnInit {
    screenSize: PepScreenSizeType;
    fomoService: FomoService;

    constructor(
        public router: Router,
        public route: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public pepAddonService: PepAddonService
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.fomoService = new FomoService(this.pepAddonService);

    }

    ngOnInit() {
    }

    openDialog() {

    }

    listDataSource: IPepGenericListDataSource = {
        init: async (state) => {
            const filterObjects: FilterObject[] = await this.fomoService.getFilterObjects();
            return {
                dataView: {
                    Context: {
                        Name: '',
                        Profile: { InternalID: 0 },
                        ScreenSize: 'Landscape'
                    },
                    Type: 'Grid',
                    Title: '',
                    Fields: [
                        {
                            FieldID: 'Name',
                            Type: 'TextBox',
                            Title: 'Name',
                            Mandatory: true,
                            ReadOnly: true
                        },
                        {
                            FieldID: 'Field',
                            Type: 'TextBox',
                            Title: 'Field',
                            Mandatory: true,
                            ReadOnly: true
                        },
                        {
                            FieldID: 'Resource',
                            Type: 'TextBox',
                            Title: 'From Resource',
                            Mandatory: true,
                            ReadOnly: true
                        },
                        {
                            FieldID: 'PreviousField',
                            Type: 'TextBox',
                            Title: 'Filter Field',
                            Mandatory: false,
                            ReadOnly: true
                        },
                        {
                            FieldID: 'PreviousFilter',
                            Type: 'TextBox',
                            Title: 'In Filter Rule',
                            Mandatory: false,
                            ReadOnly: true
                        }

                    ],
                    Columns: [
                        {
                            Width: 25
                        },
                        {
                            Width: 25
                        },
                        {
                            Width: 25
                        },
                        {
                            Width: 25
                        },
                        {
                            Width: 25
                        }
                    ],
                    FrozenColumnsCount: 0,
                    MinimumColumnWidth: 0
                },
                items: filterObjects,
                totalCount: filterObjects.length
            }
        }

    }

    actions: IPepGenericListActions = {
        get: async (data: PepSelectionData) => {
            if (data.rows.length) {
                return [{
                    title: this.translate.instant("Edit"),
                    handler: async (data) => {
                        this.router.navigate([[data?.rows[0]].toString()], {
                            relativeTo: this.route,
                            queryParamsHandling: 'merge'
                        });
                    }
                }]
            } else return []
        }
    }
}
