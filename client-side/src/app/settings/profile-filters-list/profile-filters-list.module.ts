import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';

import { PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepIconRegistry, pepIconSystemClose } from '@pepperi-addons/ngx-lib/icon';
import { MatTabsModule } from '@angular/material/tabs';
// import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
// import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
// import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
// import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';

import { ProfileFiltersListComponent } from './profile-filters-list.component';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';

const pepIcons = [
    pepIconSystemClose,
];

@NgModule({
    declarations: [
        ProfileFiltersListComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        // PepIconModule,
        // PepDialogModule,
        PepTopBarModule,
        // PepMenuModule,
        PepPageLayoutModule,
        // PepButtonModule,
        // PepTextboxModule,
        PepGenericListModule,
        MatTabsModule,
        PepButtonModule,
        TranslateModule.forChild(),
    ],
    exports: [ProfileFiltersListComponent]
})
export class ProfileFiltersListModule {
    constructor(
        private pepIconRegistry: PepIconRegistry,
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
