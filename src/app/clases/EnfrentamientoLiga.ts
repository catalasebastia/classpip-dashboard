export class EnfrentamientoLiga {
  JugadorUno: number;
  JugadorDos: number;
  Ganador: number;
  JornadaDeCompeticionLigaId: number;
  nombreJugadorUno: string;
  nombreJugadorDos: string;
  nombreGanador: string;
  id: number;

  constructor(JugadorUno?: number, JugadorDos?: number, Ganador?: number, JornadaDeCompeticionLigaId?: number,
              nombreJugadorUno?: string, nombreJugadorDos?: string) {

    this.JugadorUno = JugadorUno;
    this.JugadorDos = JugadorDos;
    this.Ganador = Ganador;
    this.JornadaDeCompeticionLigaId = JornadaDeCompeticionLigaId;
    this.nombreJugadorUno = nombreJugadorUno;
    this.nombreJugadorDos = nombreJugadorDos;
  }
}
