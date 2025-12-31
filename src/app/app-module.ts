import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { App } from './app';

import { CarouselComponent } from './components/carousel/carousel.component';
import { DataTableComponent } from './components/data-table/data-table.component';

@NgModule({
  declarations: [
    App,
    CarouselComponent,
    DataTableComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CommonModule
  ],
  providers: [
    // Global error handling for browser environment
    provideBrowserGlobalErrorListeners()
  ],
  // Bootstrap the root App component
  bootstrap: [App]
})
export class AppModule { }
