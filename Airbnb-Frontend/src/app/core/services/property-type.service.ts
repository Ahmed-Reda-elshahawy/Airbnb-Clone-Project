import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyTypeService {

  constructor( private _HttpClient:HttpClient) {}

getAllPropertyTypes():Observable<any>{
  return this._HttpClient.get('https://localhost:7200/api/PropertyTypes')
}

getPropertyTypeById(id:string):Observable<any>{
  return this._HttpClient.get(`https://localhost:7200/api/propertytypes/${id}`)
}

}
