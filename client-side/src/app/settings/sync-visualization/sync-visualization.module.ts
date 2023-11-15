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
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { SyncVisualizationComponent } from './sync-visualization.component';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';

const pepIcons = [
    pepIconSystemClose,
];

@NgModule({
    declarations: [
        SyncVisualizationComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        PepTopBarModule,
        PepPageLayoutModule,
        PepGenericListModule,
        MatTabsModule,
        PepButtonModule,
        TranslateModule.forChild(),
    ],
    exports: [SyncVisualizationComponent],
})

export class SyncVisualizationModule {
    constructor(
        private pepIconRegistry: PepIconRegistry,
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
