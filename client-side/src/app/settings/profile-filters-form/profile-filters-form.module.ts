import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';

import { PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepIconRegistry, PepIconModule, pepIconSystemClose } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepGenericFormModule } from '@pepperi-addons/ngx-composite-lib/generic-form';

import { ProfileFiltersFormComponent } from './profile-filters-form.component';
import { MatDialogModule } from '@angular/material/dialog';

const pepIcons = [
    pepIconSystemClose,
];

export const routes: Routes = [
    {
        path: '',
        component: ProfileFiltersFormComponent
    }
];

@NgModule({
    declarations: [
        ProfileFiltersFormComponent,
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepTopBarModule,
        PepPageLayoutModule,
        PepSizeDetectorModule,
        PepIconModule,
        PepMenuModule,
        PepButtonModule,
        PepDialogModule,
        PepTextboxModule,
        PepGenericFormModule,
        PepGenericListModule,
        PepDialogModule,
        MatDialogModule,
        BrowserAnimationsModule,
        TranslateModule.forChild(),
        RouterModule.forChild(routes)
    ],
    exports: [ProfileFiltersFormComponent]
})
export class ProfileFiltersFormModule {
    constructor(
        private pepIconRegistry: PepIconRegistry
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
