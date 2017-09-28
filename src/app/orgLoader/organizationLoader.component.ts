import {Component, ViewChild} from '@angular/core';
import {OrganizationUnitLoaderService} from './organizationUnitLoader.service';
import {OrganizationUnit} from "./OrganizationUnit";
import {OrderByDisplayNamePipe} from "./organizationLoader.pipe";
import {DatePickerComponent} from "../datePicker/datePicker.component";

@Component({
  selector: 'facilityBurden-app',
  templateUrl: 'app/orgLoader/organizationLoader.component.html',
  providers: [OrganizationUnitLoaderService, OrderByDisplayNamePipe]
})


export class OrganizationLoaderComponent {
  organizationUnits: OrganizationUnit[];
  private query:string;
  private levels: number[] = [1];
  message:string = '';
  isLoading:boolean = false;
  isValid:boolean = false;
  private selectedOrgUnit: OrganizationUnit;

  @ViewChild(DatePickerComponent) datePicker : DatePickerComponent;


  constructor(private _orgLoaderService: OrganizationUnitLoaderService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this._orgLoaderService.getOrgUnits('api/organisationUnits?level=1&paging=0&fields=id,displayName,level', JSON.parse(sessionStorage.getItem("user")))
      .subscribe((units:any) => {
        this.organizationUnits = units.organisationUnits});
    this.isLoading = false;
  }

  loadLevel(ancestorId : string, lvl : number) : void {
    this.isLoading = true;
    this.selectedOrgUnit = this.findSelectedOrgUnit(ancestorId);
    this.setLevel(this.selectedOrgUnit, lvl);

    if(this.selectedOrgUnit != null) {
      this.query = 'api/organisationUnits?filter=id:eq:' + ancestorId + '&fields=children[id,displayName,level]&paging=0';
      this._orgLoaderService.getOrgUnits(this.query, JSON.parse(sessionStorage.getItem("user")))
        .subscribe((units: any) => {
          this.selectedOrgUnit.children = units.organisationUnits[0].children;
          if (this.selectedOrgUnit.children.length > 0)
            this.levels.push(this.levels.length + 1);
        });
    }
    else if(lvl > 1) {
      this.selectedOrgUnit = this.findSelectOrgUnit(lvl-1);
    }
    //this.message = "";
    this.isLoading = false;
  }

  findSelectedOrgUnit(ancestorId: string) : OrganizationUnit {

    var orgUnitsAtGivenLevel = this.organizationUnits;
    var org : OrganizationUnit = null;
    if(ancestorId.startsWith("Choose"))
      return org;

    do {
      if((org = orgUnitsAtGivenLevel.find(org => org.id === ancestorId)) != null) {
        return org;
      }
    }while ((orgUnitsAtGivenLevel = orgUnitsAtGivenLevel.find(org => org.selected === true).children) != null);
  }

  findChildrenOfSelectedOrgUnit(level: number) : OrganizationUnit[] {
    var orgUnitsAtGivenLevel = this.organizationUnits;

    for(var i = 0; i < this.levels.length; i++){
      if(i+1 == level){
        return orgUnitsAtGivenLevel;
      }
      orgUnitsAtGivenLevel = orgUnitsAtGivenLevel.find(org => org.selected === true).children;
    }
  }

  setLevel(selectedOrgUnit : OrganizationUnit, level : number) : void {
    var orgUnitsAtLevel = this.findChildrenOfSelectedOrgUnit(level);

    orgUnitsAtLevel.map(org => org.selected = false);
    orgUnitsAtLevel.map(org => org.children = []);
    if(selectedOrgUnit != null)
      selectedOrgUnit.selected = true;

    if(this.levels.length > level)
      this.levels = this.levels.slice(0, level);
  }
  findSelectOrgUnit(lvl:number): OrganizationUnit {

    var orgUnitsAtGivenLevel = this.organizationUnits;

    for(var i = 0; i < this.levels.length; i++){
      if(i+1 == lvl){
        return orgUnitsAtGivenLevel.find(org => org.selected === true);
      }
      orgUnitsAtGivenLevel = orgUnitsAtGivenLevel.find(org => org.selected === true).children;
    }
  }



  select(event:any):void {
    this.message = '';
    //Happy day scenario
    if(this.getIsValid() && this.datePicker.getIsValid()) {
      this.message = 'Selected orgOrg name: ' + this.selectedOrgUnit.displayName + ", " +
        "Date range: from" + this.datePicker.getStartDate().toLocaleDateString('en-GB') + ' to: ' + this.datePicker.getEndDate().toLocaleDateString('en-GB');
      console.log('Message:', this.message);
    }
    //Bad things happened
    if(!this.getIsValid()) {
      console.log('Message org not set:', this.message);
      return;
    }
    if(!this.datePicker.getIsValid()){
      this.message += this.datePicker.getDatePickerMessage() + '<br/>';
      console.log('Message datapicker not valid:', this.datePicker.getDatePickerMessage());
      console.log('Start date:', this.datePicker.getStartDate());
      return;
    }
    console.log('Message final output:', this.message);
  }


  /*
   * Validation form helper methods
   */
  validate(): void {
    if(this.selectedOrgUnit == null) {
      this.message = "Error: OrgUnit not set";
      this.isValid = false;
      return;
    }
    this.isValid = true;
  }
  getIsValid():boolean {
    this.validate();
    return this.isValid;
  }
}
