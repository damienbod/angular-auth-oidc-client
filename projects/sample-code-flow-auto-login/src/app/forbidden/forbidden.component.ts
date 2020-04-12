import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-forbidden',
    templateUrl: 'forbidden.component.html'
})

export class ForbiddenComponent implements OnInit {

    public message: string;
    public values: any[];

    constructor() {
        this.message = 'ForbiddenComponent constructor';
    }

    ngOnInit() {
    }
}
