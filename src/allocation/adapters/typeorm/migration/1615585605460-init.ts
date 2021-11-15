import {MigrationInterface, QueryRunner} from "typeorm";

export class init1615585605460 implements MigrationInterface {
    name = 'init1615585605460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "batches" ("id" SERIAL NOT NULL, "reference" character varying NOT NULL, "sku" character varying NOT NULL, "qty" integer NOT NULL, "eta" TIMESTAMP, "purchasedQuantity" integer, CONSTRAINT "PK_55e7ff646e969b61d37eea5be7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_lines" ("id" SERIAL NOT NULL, "orderId" character varying NOT NULL, "sku" character varying NOT NULL, "qty" integer NOT NULL, CONSTRAINT "PK_627dcd7f1d707de4df241b2da6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "allocations" ("batchId" integer NOT NULL, "orderLineId" integer NOT NULL, CONSTRAINT "PK_1aa5dfe2024d9afafd352a567c9" PRIMARY KEY ("batchId", "orderLineId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_898d6e85ee82ae53cf8a1954c1" ON "allocations" ("batchId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3034062600c7968012bd71c686" ON "allocations" ("orderLineId") `);
        await queryRunner.query(`ALTER TABLE "allocations" ADD CONSTRAINT "FK_898d6e85ee82ae53cf8a1954c1e" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "allocations" ADD CONSTRAINT "FK_3034062600c7968012bd71c6860" FOREIGN KEY ("orderLineId") REFERENCES "order_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "allocations" DROP CONSTRAINT "FK_3034062600c7968012bd71c6860"`);
        await queryRunner.query(`ALTER TABLE "allocations" DROP CONSTRAINT "FK_898d6e85ee82ae53cf8a1954c1e"`);
        await queryRunner.query(`DROP INDEX "IDX_3034062600c7968012bd71c686"`);
        await queryRunner.query(`DROP INDEX "IDX_898d6e85ee82ae53cf8a1954c1"`);
        await queryRunner.query(`DROP TABLE "allocations"`);
        await queryRunner.query(`DROP TABLE "order_lines"`);
        await queryRunner.query(`DROP TABLE "batches"`);
    }

}
