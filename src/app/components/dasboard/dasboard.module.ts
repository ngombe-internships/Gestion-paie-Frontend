import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DasboardRoutingModule } from './dasboard-routing.module';
import { DasboardComponent } from './dasboard.component';

@NgModule({
  imports: [
    CommonModule,
    DasboardRoutingModule,
    DasboardComponent
  ]
})
export class DasboardModule { }
