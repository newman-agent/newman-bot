import { Module } from "@nestjs/common";
import { SearchService } from "./search.service";
/* 
* import { DuckDuckGoAdapter} from "./adapters/duckduckgo.adapter";
* import { BraveAdapter} from "./adapters/brave.adapter";
*/
import { SearchRepository } from "../../core/domain/repositories/search.repository";

@Module({
  providers: [
    /* DuckDuckGoAdapter,
    * BraveAdapter,*/
    {
      provide: SearchRepository,
      useClass: SearchService,
    },
  ],
  exports: [SearchRepository],
})

export class SearchModule { }
