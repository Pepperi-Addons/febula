import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        // component: SettingsComponent,
        children: [
            {
                path: ':form_key',
                loadChildren: () => import('./filter-form/filter-form.module').then(m => m.FilterFormModule)
            },
            {
                path: '**',
                loadChildren: () => import('./settings-tabs/settings-tabs.module').then(m => m.SettingsTabsModule),

            }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }



