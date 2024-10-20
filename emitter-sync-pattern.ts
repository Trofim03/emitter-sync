/* Check the comments first */

import { EventEmitter } from "./emitter";
import { EventDelayedRepository } from "./event-repository";
import { EventStatistics } from "./event-statistics";
import { ResultsTester } from "./results-tester";
import { triggerRandomly } from "./utils";

const MAX_EVENTS = 1000;

enum EventName {
  EventA = "A",
  EventB = "B",
}

const EVENT_NAMES = [EventName.EventA, EventName.EventB];

/*

  An initial configuration for this case

*/

function init() {
  const emitter = new EventEmitter<EventName>();

  triggerRandomly(() => emitter.emit(EventName.EventA), MAX_EVENTS);
  triggerRandomly(() => emitter.emit(EventName.EventB), MAX_EVENTS);

  const repository = new EventRepository();
  const handler = new EventHandler(emitter, repository);

  const resultsTester = new ResultsTester({
    eventNames: EVENT_NAMES,
    emitter,
    handler,
    repository,
  });
  resultsTester.showStats(20);
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */

/*

  The implementation of EventHandler and EventRepository is up to you.
  Main idea is to subscribe to EventEmitter, save it in local stats
  along with syncing with EventRepository.

*/

class EventHandler extends EventStatistics<EventName> {
  // Feel free to edit this class

  repository: EventRepository;

  constructor(emitter: EventEmitter<EventName>, repository: EventRepository) {
    super();
    this.repository = repository;

    for (let item in EventName) {
      const typedItem = item as keyof typeof EventName

      emitter.subscribe(EventName[typedItem], () =>{
        this.repository.saveEventData(EventName[typedItem], 1)
        this.setStats(EventName[typedItem], this.getStats(EventName[typedItem]) + 1)
      });
    }
  }
}

type notSavedDataType = {[key in EventName]?: number}

class EventRepository extends EventDelayedRepository<EventName> {
  // Feel free to edit this class

  notSavedData: notSavedDataType
  lastRequestTime: number

  constructor() {
    super();
    this.notSavedData = {}
  }

  async saveEventData(eventName: EventName, _: number) {
    try {
      let valueToSave = 1;      
      if (this.notSavedData[eventName]) {
        valueToSave = this.notSavedData[eventName] + 1
      }

      await this.updateEventStatsBy(eventName, valueToSave);
      this.updateNotSavedData(eventName, true)
      this;
    } catch (e) {
      this.updateNotSavedData(eventName, false)
      // const _error = e as EventRepositoryError;
      // console.warn(error);
    }
  }

  private updateNotSavedData(eventName: EventName, deleteEvent: boolean) {
    // Очищаем значение, которое прошло сохранение
    if (deleteEvent) {
      const newObj: notSavedDataType = {}
      Object.keys(this.notSavedData).forEach(key => {
        const typedKey = key as EventName
        if (typedKey !== eventName) {
          newObj[typedKey] = this.notSavedData[typedKey] 
        }
      })

      this.notSavedData = newObj
      return;
    }

    if (this.notSavedData[eventName]) {
      this.notSavedData[eventName] = this.notSavedData[eventName] + 1
      return;
    } else {
      this.notSavedData[eventName] = 1
      return;
    }
  }
}

init();
