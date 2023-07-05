import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { IPepGenericListDataSource, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { FomoService } from "src/services/fomo.service";
import { FilterObject } from "../../../../../shared/types";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { FilterFormComponent } from "../filter-form/filter-form.component";
import { config } from "../../app.config";
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";

@Component({
    selector: 'filters-list',
    templateUrl: './filters-list.component.html',
    styleUrls: ['./filters-list.component.scss']
})
export class FiltersListComponent implements OnInit, OnChanges {
    @Input() filterObjects: FilterObject[];
    @Input() resources: Collection[];
    @Output() changesEvent: EventEmitter<any> = new EventEmitter<any>();
    
    screenSize: PepScreenSizeType;
    fomoService: FomoService;
    filterObjectsMap: Map<string, FilterObject> = new Map<string, FilterObject>();


    constructor(
        public router: Router,
        public route: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public pepAddonService: PepAddonService,
        private dialogService: PepDialogService,

    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.fomoService = new FomoService(this.pepAddonService);
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) { 
        this.updateFilterObjectsMap(this.filterObjects);
        this.listDataSource = this.getDataSource();
    }


    private openAttachmentDialog(callback: (value: any) => void, data?: { filterObject: FilterObject }) {
        this.listDataSource = this.getDataSource(); // update all different resources so form will have the latest data
        const config = this.dialogService.getDialogConfig({}, 'large');

        config.data = new PepDialogData({
            content: FilterFormComponent,
        })
        this.dialogService.openDialog(FilterFormComponent, { ...data, filterObjectList: this.filterObjects, resourceList: this.resources }, config).afterClosed().subscribe((value) => {
            if (value) {
                console.log(JSON.stringify(value));
                this.emitChangesEvent();
                this.listDataSource = this.getDataSource();
                callback(value);
            }
        });
    }

    private isLocked(filterObject: FilterObject) {
        return filterObject.AddonUUID !== undefined;
    }

    buttonClick($event: any) {
        this.openAttachmentDialog((value) => {
            console.log(`callback from dialog: ${JSON.stringify(value)}`);
        });
    }

    updateFilterObjectsMap(filterObjects: FilterObject[]) {
        filterObjects.forEach(filterObject => {
            this.filterObjectsMap.set(filterObject.Key, filterObject);
        });
    }

    getSearchedFilterObjects(searchText?: string): FilterObject[] {
        let filterObjectsToReturn;
        if (!searchText) {
            filterObjectsToReturn = this.filterObjects;
        }
        else filterObjectsToReturn = this.filterObjects.filter(filterObject => {
            return filterObject.Name.toLowerCase().includes(searchText.toLowerCase());
        });

        //order by name
        filterObjectsToReturn.sort((a, b) => {
            return a.Name.localeCompare(b.Name);
        }
        );

        return filterObjectsToReturn;
    }

    emitChangesEvent() { ;
        this.changesEvent.emit({action:"filterObjectChange"});
    }

    getDataSource() {
        return {
            init: async (state) => {
                const searchedFilterObjects = this.getSearchedFilterObjects(state.searchString);
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
                                FieldID: 'PreviousFilterName',
                                Type: 'TextBox',
                                Title: 'In Filter Rule',
                                Mandatory: false,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'Locked',
                                Type: 'Boolean',
                                Title: 'System',
                                Mandatory: true,
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
                            },
                            {
                                Width: 10
                            }
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                    },
                    items: searchedFilterObjects.map(filterObject => {
                        return {
                            ...filterObject,
                            PreviousFilterName: this.filterObjectsMap.get(filterObject.PreviousFilter)?.Name,
                            Locked: this.isLocked(filterObject)
                        }
                    }),
                    totalCount: searchedFilterObjects.length
                }
            }
        } as IPepGenericListDataSource;
    }
    listDataSource: IPepGenericListDataSource = this.getDataSource();

    editAction = {
        title: this.translate.instant("Edit"),
        handler: async (data) => {
            const filterObjectKey = data?.rows[0];
            const filterObject = this.filterObjectsMap.get(filterObjectKey);
            this.openAttachmentDialog((value) => {
                console.log(`callback from dialog: ${JSON.stringify(value)}`);
            }, { filterObject });
        }
    }

    deleteAction = {
        title: this.translate.instant("Delete"),
        handler: async (data) => {
            const filterObjectKeys = data?.rows;
            await this.fomoService.deleteFilterObjects(filterObjectKeys);
            this.emitChangesEvent()
            this.listDataSource = this.getDataSource();
        }
    }

    actions: IPepGenericListActions = {
        get: async (data: PepSelectionData) => {
            // if there is at least one selected row for which the FilterObject has an OwnerUUID that is not config.AddonUUID, then return empty array. we don't want to show the actions in this case since the user doesn't have permission to edit or delete the FilterObject.
            if (data.rows.some(row => {
                const filterObject = this.filterObjectsMap.get(row);
                return this.isLocked(filterObject);
            })) {
                return [];
            }
            if (data.rows.length == 1) {
                return [
                    this.editAction,
                    this.deleteAction
                ]
            }
            else if (data.rows.length > 1) {
                return [
                    this.deleteAction
                ]
            }
            else return []
        }
    }
}
