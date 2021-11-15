import {MigrationInterface, QueryRunner} from "typeorm";

export class AllocationsView1616840145043 implements MigrationInterface {
    name = 'AllocationsView1616840145043'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "allocations_view" ("id" SERIAL NOT NULL, "orderId" character varying NOT NULL, "sku" character varying NOT NULL, "batchRef" character varying NOT NULL, CONSTRAINT "PK_1684bac3a1f7029a371ccf8d433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "allocations_view"`);
    }

}
