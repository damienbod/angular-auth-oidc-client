import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LazyRoutingModule } from './lazy-routing.module';
import { LazyComponent } from './lazy.component';

@NgModule({
  declarations: [LazyComponent],
  imports: [CommonModule, LazyRoutingModule],
})
export class LazyModule {}
