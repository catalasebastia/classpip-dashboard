import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog, MatTabGroup } from '@angular/material';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// Clases
// tslint:disable-next-line:max-line-length
import { Alumno, Equipo, Juego, JuegoDeCompeticion, Punto, AlumnoJuegoDePuntos, EquipoJuegoDePuntos, Grupo, AlumnoJuegoDeCompeticionLiga, EquipoJuegoDeCompeticionLiga, Jornada} from '../../clases/index';

// Services
import { SesionService, CalculosService, PeticionesAPIService } from '../../servicios/index';


import { Observable} from 'rxjs';
import { of } from 'rxjs';
import 'rxjs';

import { DialogoConfirmacionComponent } from '../COMPARTIDO/dialogo-confirmacion/dialogo-confirmacion.component';
import Swal from 'sweetalert2';




export interface OpcionSeleccionada {
  nombre: string;
  id: string;
}

export interface ChipColor {
  nombre: string;
  color: ThemePalette;
}



@Component({
  selector: 'app-juego',
  templateUrl: './juego.component.html',
  styleUrls: ['./juego.component.scss']
})

export class JuegoComponent implements OnInit {


  ///////////////////////////////////// PARÁMETROS GENERALES PARA EL COMPONENTE ///////////////////////////////////

  grupo: Grupo;
  alumnosGrupo: Alumno[];
  equiposGrupo: Equipo[];
  @ViewChild('stepper') stepper;
  @ViewChild('tabs') tabGroup: MatTabGroup;

  // tslint:disable-next-line:ban-types
  juegoCreado: Boolean = false;

  juego: Juego;
  juegoDeCompeticion: JuegoDeCompeticion;
  myForm: FormGroup;

  // HACEMOS DOS LISTAS CON LOS JUEGOS ACTIVOS E INACTIVOS DE LOS TRES TIPOS DE JUEGOS
  juegosActivos: Juego[];
  juegosInactivos: Juego[];


  // tslint:disable-next-line:no-inferrable-types
  opcionSeleccionada: string = 'todosLosJuegos';




  //////////////////////////////////// PARÁMETROS PARA PÁGINA DE CREAR JUEGO //////////////////////////////////////

  // En el primer paso mostraremos tres Chips con las diferentes opciones de tipo de juego que podemos crear y su color
  seleccionTipoJuego: ChipColor[] = [
    {nombre: 'Juego De Puntos', color: 'primary'},
    {nombre: 'Juego De Colección', color: 'accent'},
    {nombre: 'Juego De Competición', color: 'warn'}
  ];

  // En el segundo paso mostraremos dos Chips con los dos modos de juego que podemos crear y su color
  seleccionModoJuego: ChipColor[] = [
    {nombre: 'Individual', color: 'primary'},
    {nombre: 'Equipos', color: 'accent'}
  ];

    // En el segundo paso mostraremos dos Chips con los dos modos de juego que podemos crear y su color
    seleccionTipoJuegoCompeticion: ChipColor[] = [
      {nombre: 'Liga', color: 'primary'},
      {nombre: 'Torneo', color: 'accent'}
    ];

  // Recogemos la opción que seleccionemos en el primer (tipoDeJuegoSeleccionado) y en el segundo paso (modoDeJuegoSeleccionado)
  tipoDeJuegoSeleccionado: string;
  modoDeJuegoSeleccionado: string;

  //
  tipoJuegoCompeticionSeleccionado: string;

  // No nos permite avanzar en el primer paso si no se ha seleccionado una opción
  // tslint:disable-next-line:ban-types
  isDisabled: Boolean = true;

  // No nos permite avanzar en el segundo paso si no se ha seleccionado opción
  // tslint:disable-next-line:ban-types
  isDisabledModo: Boolean = true;


  tipoJuegoElegido: string;
  nombreColeccionSeleccionada: string;
  // tslint:disable-next-line:ban-types
  finalizar: Boolean = false;

  constructor(
               public dialog: MatDialog,
               private calculos: CalculosService,
               private sesion: SesionService,
               private location: Location,
               private peticionesAPI: PeticionesAPIService,
               // tslint:disable-next-line:variable-name
               private _formBuilder: FormBuilder,
               ) { }


  ngOnInit() {
    this.grupo = this.sesion.DameGrupo();
    this.alumnosGrupo = this.sesion.DameAlumnosGrupo();
    // La lista de equipos del grupo no esta en el servicio sesión. Asi que hay que
    // ir a buscarla
    this.peticionesAPI.DameEquiposDelGrupo(this.grupo.id)
    .subscribe(equipos => {
      if (equipos[0] !== undefined) {
        console.log('Hay equipos');
        this.equiposGrupo = equipos;
        console.log(this.equiposGrupo);
      } else {
        // mensaje al usuario
        console.log('Este grupo aun no tiene equipos');
        this.equiposGrupo = undefined;
      }
    });

    // Ahora traemos la lista de juegos
    // esta operacion es complicada. Por eso está en calculos
    this.calculos.DameListaJuegos(this.grupo.id)
    .subscribe ( listas => {
            console.log ('He recibido los juegos');
            this.juegosActivos = listas.activos;
            // Si la lista aun esta vacia la dejo como indefinida para que me
            // salga el mensaje de que aun no hay juegos
            if (listas.activos[0] === undefined) {
              this.juegosActivos = undefined;
              console.log ('No hay inactivos');
            } else {
              this.juegosActivos = listas.activos;
              console.log ('hay activos');
            }
            if (listas.inactivos[0] === undefined) {
              this.juegosInactivos = undefined;
              console.log ('No hay inactivos');
            } else {
              this.juegosInactivos = listas.inactivos;
              console.log ('hay inactivos');
            }

    });
    console.log ('Ya he traido los juegos');

    this.myForm = this._formBuilder.group({
      NumeroDeJornadas: ['', Validators.required],
    });
  }

  //////////////////////////////////////// FUNCIONES PARA LISTAR JUEGOS ///////////////////////////////////////////////


  // Busca la lista de juego de puntos y la clasifica entre activo e inactivo, y activa la función ListaJuegosDeColeccion

  // Función que usaremos para clicar en un juego y entrar en él,
  // Enviamos juego a la sesión
  JuegoSeleccionado(juego: Juego) {
    this.sesion.TomaJuego(juego);
  }




  ///////////////////////////////////////// FUNCIONES PARA CREAR JUEGO ///////////////////////////////////////////////

  // RECUPERA LOS EQUIPOS DEL GRUPO
  TraeEquiposDelGrupo() {
    this.peticionesAPI.DameEquiposDelGrupo(this.grupo.id)
    .subscribe(equipos => {
      if (equipos[0] !== undefined) {
        console.log('Hay equipos');
        this.equiposGrupo = equipos;
        console.log(this.equiposGrupo);
      } else {
        // mensaje al usuario
        console.log('Este grupo aun no tiene equipos');
      }

    });
  }

  // Recoge el tipo de juego seleccionado y lo mete en la variable (tipoDeJuegoSeleccionado), la cual se usará después
  // para el POST del juego
  TipoDeJuegoSeleccionado(tipo: ChipColor) {
    this.tipoDeJuegoSeleccionado = tipo.nombre;
    console.log(this.tipoDeJuegoSeleccionado);
    this.isDisabled = false;
  }


  // Recoge el modo de juego seleccionado y lo mete en la variable (modoDeJuegoSeleccionado), la cual se usará después
  // para el POST del juego
  ModoDeJuegoSeleccionado(modo: ChipColor) {
    this.modoDeJuegoSeleccionado = modo.nombre;
    if (this.modoDeJuegoSeleccionado === 'Individual') {
      if (this.alumnosGrupo === undefined) {
        this.isDisabledModo = true;
        Swal.fire('Alerta', 'No hay ningún alumno en este grupo', 'warning');
        console.log('No Hay alumnos, no puedo crear el juego');
      } else {
        console.log('Hay alumnos, puedo crear');
        this.isDisabledModo = false;
      }

    } else {
      if (this.equiposGrupo === undefined) {
        this.isDisabledModo = true;
        Swal.fire('Alerta', 'No hay ningún equipo en este grupo', 'warning');
        console.log('No se puede crear juego pq no hay equipos');
      } else {
        this.isDisabledModo = false;
        console.log('Hay equipos, puedo crear');
      }

    }
  }

  // Función que usaremos para crear un juego de puntos.
  // Hay que diferenciar entre los tres juegos porque la URL es diferente
  CrearJuegoDePuntos() {
    this.peticionesAPI.CreaJuegoDePuntos(new Juego (this.tipoDeJuegoSeleccionado, this.modoDeJuegoSeleccionado), this.grupo.id)
    .subscribe(juegoCreado => {
      this.juego = juegoCreado;
      console.log(juegoCreado);
      console.log('Juego creado correctamente');
      this.sesion.TomaJuego(this.juego);
      this.juegoCreado = true;
    });
  }

  CrearJuegoDeColeccion() {
    this.peticionesAPI.CreaJuegoDeColeccion(new Juego (this.tipoDeJuegoSeleccionado, this.modoDeJuegoSeleccionado), this.grupo.id)
    .subscribe(juegoCreado => {
      this.juego = juegoCreado;
      console.log(juegoCreado);
      console.log('Juego creado correctamente');
      this.sesion.TomaJuego(this.juego);
      this.juegoCreado = true;
    });
  }

  CrearJuegoDeCompeticionLiga() {
    console.log ('&&&&&& ' + this.tipoJuegoCompeticionSeleccionado);

    let NumeroDeJornadas: number;
    let Jornadas: Jornada[];
    NumeroDeJornadas = this.myForm.value.NumeroDeJornadas;
    console.log(NumeroDeJornadas);
    console.log(new Juego (this.tipoDeJuegoSeleccionado + ' Liga', this.modoDeJuegoSeleccionado,
                  undefined, true, NumeroDeJornadas, this.tipoJuegoCompeticionSeleccionado), this.grupo.id);
    // tslint:disable-next-line:max-line-lengtholean)
    this.peticionesAPI.CreaJuegoDeCompeticionLiga(new Juego (this.tipoDeJuegoSeleccionado + ' ' + this.tipoJuegoCompeticionSeleccionado,
                                                    this.modoDeJuegoSeleccionado, undefined, true, NumeroDeJornadas,
                                                    this.tipoJuegoCompeticionSeleccionado), this.grupo.id)
    .subscribe(juegoCreado => {
      this.juego = juegoCreado;
      console.log(juegoCreado);
      console.log('Juego creado correctamente');
      this.sesion.TomaJuego(this.juego);
      this.juegoCreado = true;
      console.log('Voy a crear las ' + NumeroDeJornadas + ' jornadas');
      Jornadas = this.calculos.CrearJornadasLiga(NumeroDeJornadas, this.juego.id);
      console.log('Jornadas creadas correctamente');
      this.sesion.TomaDatosJornadasJuegoComponent(Jornadas);
      // this.calculos.CrearenfrentamientosLiga();
    });
  }

  // CrearJuegoDeCompeticionLiga() {
  //   console.log ('&&&&&& ' + this.tipoJuegoCompeticionSeleccionado);

  //   let NumeroDeJornadas: number;
  //   NumeroDeJornadas = this.myForm.value.NumeroDeJornadas;
  //   console.log(NumeroDeJornadas);
  //   console.log(new JuegoDeCompeticion (NumeroDeJornadas, this.tipoDeJuegoSeleccionado + ' Liga',
  //   this.modoDeJuegoSeleccionado), this.grupo.id);
  //   // tslint:disable-next-line:max-line-lengtholean)
  //   this.peticionesAPI.CreaJuegoDeCompeticionLiga(new JuegoDeCompeticion (NumeroDeJornadas, this.tipoDeJuegoSeleccionado + ' Liga',
  //     this.modoDeJuegoSeleccionado), this.grupo.id)
  //   .subscribe(juegoCreado => {
  //     this.juegoDeCompeticion = juegoCreado;
  //     console.log(juegoCreado);
  //     console.log('Juego creado correctamente');
  //     this.sesion.TomaJuego(this.juego);
  //     this.juegoCreado = true;
  //   });
  // }
  // Si decidimos crear un juego de puntos, lo crearemos ya en la base de datos y posteriormente le añadiremos puntos y niveles
  // Si decidimos crear un juego de colección no haremos el POST en este paso, sino en el siguente cuando indiquemos la colección
  // Si decidimos crear un juego de competición tampoco haremos el POST en este paso, sino cuando indiquemos el tipo de competición

  CrearJuegoCorrespondiente() {
    if (this.tipoDeJuegoSeleccionado === 'Juego De Puntos') {
      console.log('Voy a crear juego de puntos');
      this.CrearJuegoDePuntos();
    } else if (this.tipoDeJuegoSeleccionado === 'Juego De Colección') {
      console.log('Voy a crear juego de colección');
      this.CrearJuegoDeColeccion();
    } else if (this.tipoDeJuegoSeleccionado === 'Juego De Competición' && this.tipoJuegoCompeticionSeleccionado === 'Liga') {
      console.log('Voy a crear juego de Competición Liga');
      this.CrearJuegoDeCompeticionLiga();
    }

    Swal.fire('Creado', this.tipoDeJuegoSeleccionado + ' creado correctamente', 'success');
  }

  TipoDeJuegoCompeticionSeleccionado(tipoCompeticion: ChipColor) {
    this.tipoJuegoCompeticionSeleccionado = tipoCompeticion.nombre;
    console.log('El juego de competición será tipo: ' + tipoCompeticion.nombre);
    this.isDisabled = false;
  }



  Finalizar() {
    console.log ('Entro en finalizar');
    console.log (this.tipoDeJuegoSeleccionado);
    const datos = this.sesion.DameDatosJornadasJuegoComponent();
    let jornadas: Jornada[];
    jornadas = datos.jornadas;

    if (this.tipoDeJuegoSeleccionado === 'Juego De Competición') {
      if (this.tipoJuegoCompeticionSeleccionado === 'Liga') {
        if (this.modoDeJuegoSeleccionado === 'Individual') {

          console.log('Voy a crear los enfrentamientos');
          console.log(this.alumnosGrupo.length);
          console.log(jornadas.length);
          console.log(Math.abs(this.alumnosGrupo.length % 2));
          this.calculos.calcularLiga(this.alumnosGrupo.length, jornadas.length, this.alumnosGrupo, this.grupo.id, jornadas);

          console.log('Voy a inscribir a los alumnos del grupo');

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.alumnosGrupo.length; i++) {
            console.log('alumno: ' + this.alumnosGrupo[i]);
            console.log('id alumno: ' + this.alumnosGrupo[i].id);
            console.log('juego: ' + this.juego);
            console.log('id juego: ' + this.juego.id);
            console.log(new AlumnoJuegoDeCompeticionLiga(this.alumnosGrupo[i].id, this.juego.id));
            // tslint:disable-next-line:max-line-length
            this.peticionesAPI.InscribeAlumnoJuegoDeCompeticionLiga(new AlumnoJuegoDeCompeticionLiga(this.alumnosGrupo[i].id, this.juego.id))
            .subscribe(alumnoJuego => console.log('alumnos inscritos correctamente'));
          }
        } else {

          console.log('Voy a crear los enfrentamientos');
          this.calculos.calcularLiga(this.equiposGrupo.length, jornadas.length, this.equiposGrupo, this.grupo.id, jornadas);

          console.log('Voy a inscribir los equipos al grupo');

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.equiposGrupo.length; i++) {
            console.log(this.equiposGrupo[i]);
            // tslint:disable-next-line:max-line-length
            this.peticionesAPI.InscribeEquipoJuegoDeCompeticionLiga(new EquipoJuegoDeCompeticionLiga(this.equiposGrupo[i].id, this.juego.id))
            .subscribe(equiposJuego => console.log(equiposJuego));
          }
        }
      }
    }


    console.log ('AAAA');

    if (this.tipoDeJuegoSeleccionado === 'Juego De Puntos') {
      console.log ('Es un juego de puntos');

      if (this.modoDeJuegoSeleccionado === 'Individual') {
        console.log('Voy a inscribir a los alumnos del grupo 1');

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.alumnosGrupo.length; i++) {
          console.log(this.alumnosGrupo[i]);
          this.peticionesAPI.InscribeAlumnoJuegoDePuntos(new AlumnoJuegoDePuntos(this.alumnosGrupo[i].id, this.juego.id))
          .subscribe(alumnoJuego => console.log('alumnos inscritos correctamente 1'));
        }
      } else {
        console.log('Voy a inscribir los equipos del grupo');

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.equiposGrupo.length; i++) {
          console.log(this.equiposGrupo[i]);
          this.peticionesAPI.InscribeEquipoJuegoDePuntos(new EquipoJuegoDePuntos(this.equiposGrupo[i].id, this.juego.id))
          .subscribe(equiposJuego => console.log(equiposJuego));
        }
      }




      // if (this.juego.Modo === 'Individual') {
      //     console.log('Voy a inscribir a los alumnos del grupo 2');

      //     // tslint:disable-next-line:prefer-for-of
      //     for (let i = 0; i < this.alumnosGrupo.length; i++) {
      //       console.log(this.alumnosGrupo[i]);
      //       this.peticionesAPI.InscribeAlumnoJuegoDePuntos(new AlumnoJuegoDePuntos(this.alumnosGrupo[i].id, this.juego.id))
      //       .subscribe(alumnoJuego => console.log('alumnos inscritos correctamente 2'));
      //     }
      //   } else {
      //     console.log('Voy a inscribir los equipos al grupo');

      //     // tslint:disable-next-line:prefer-for-of
      //     for (let i = 0; i < this.equiposGrupo.length; i++) {
      //       console.log(this.equiposGrupo[i].Nombre);
      //       this.peticionesAPI.InscribeEquipoJuegoDePuntos(new EquipoJuegoDePuntos(this.equiposGrupo[i].id, this.juego.id))
      //       .subscribe(equiposJuego => console.log(equiposJuego));

      //     }
      // }
    }

    console.log ('BBBBBBB');
    // El juego se ha creado como activo. Lo añadimos a la lista correspondiente
    if (this.juegosActivos === undefined) {
      // Si la lista aun no se ha creado no podre hacer el push
          this.juegosActivos = [];
    }
    this.juegosActivos.push (this.juego);


    this.juegoCreado = false;

      // Regresamos a la lista de equipos (mat-tab con índice 0)
    this.tabGroup.selectedIndex = 0;

      // Al darle al botón de finalizar limpiamos el formulario y reseteamos el stepper
    this.stepper.reset();
    this.finalizar = true;
  }

  // Recibo el nombre de la colección elegida en el componente hijo
   RecibeNombre($event) {
    this.nombreColeccionSeleccionada = $event;
  }

  goBack() {
    this.location.back();
  }


  canExit(): Observable <boolean> {
    if (!this.juegoCreado || this.finalizar) {
      return of (true);
    } else {
      const confirmacionObservable = new Observable <boolean>( obs => {
          const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
            height: '150px',
            data: {
              mensaje: 'Confirma que quieres abandonar el proceso de creación del juego',
            }
          });

          dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) {
              // Si confirma que quiere salir entonces eliminamos el grupo que se ha creado
              // this.sesion.TomaGrupo (this.grupo);
              // this.calculos.EliminarGrupo();
              // this.BorrarColeccion (this.coleccionCreada);
              if (this.tipoDeJuegoSeleccionado === 'Juego De Puntos') {
                this.peticionesAPI.BorraJuegoDePuntos(this.juego.id, this.juego.grupoId).subscribe();
              } else if (this.tipoDeJuegoSeleccionado === 'Juego De Colección') {
                this.peticionesAPI.BorraJuegoDeColeccion(this.juego.id, this.juego.grupoId).subscribe();
              }
            }
            obs.next (confirmed);
          });
      });
      return confirmacionObservable;
    }
  }


}
