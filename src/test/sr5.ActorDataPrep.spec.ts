import {SR5TestingDocuments} from "./utils";
import {SR5Actor} from "../module/actor/SR5Actor";
import {SR5Item} from "../module/item/SR5Item";
import {SR} from "../module/constants";
import CharacterActorData = Shadowrun.CharacterActorData;
import SpiritActorData = Shadowrun.SpiritActorData;
import SpriteActorData = Shadowrun.SpriteActorData;
import ICActorData = Shadowrun.ICActorData;
import VehicleActorData = Shadowrun.VehicleActorData;

export const shadowrunSR5ActorDataPrep = context => {
    const {describe, it, assert, before, after} = context;

    let testActor;
    let testItem;

    before(async () => {
        testActor = new SR5TestingDocuments(SR5Actor);
        testItem = new SR5TestingDocuments(SR5Item);
    })

    after(async () => {
        await testActor.teardown();
        await testItem.teardown();
    })

        describe('CharacterDataPrep', () => {
            it('Character default attribute values', async () => {
                const character = await testActor.create({type: 'character', 'system.metatype': 'human'});

                // Check for attribute min values;
                console.log('Physical attributes');
                assert.strictEqual(character.system.attributes.body.value, SR.attributes.ranges['body'].min);
                assert.strictEqual(character.system.attributes.agility.value, SR.attributes.ranges['agility'].min);
                assert.strictEqual(character.system.attributes.reaction.value, SR.attributes.ranges['reaction'].min);
                assert.strictEqual(character.system.attributes.strength.value, SR.attributes.ranges['strength'].min);
                assert.strictEqual(character.system.attributes.willpower.value, SR.attributes.ranges['willpower'].min);
                assert.strictEqual(character.system.attributes.logic.value, SR.attributes.ranges['logic'].min);
                assert.strictEqual(character.system.attributes.intuition.value, SR.attributes.ranges['intuition'].min);
                assert.strictEqual(character.system.attributes.charisma.value, SR.attributes.ranges['charisma'].min);

                console.log('Comon special attributes');
                assert.strictEqual(character.system.attributes.edge.value, SR.attributes.ranges['edge'].min);
                assert.strictEqual(character.system.attributes.essence.value, SR.attributes.defaults['essence']);

                console.log('Special special attributes');
                assert.strictEqual(character.system.attributes.resonance.value, SR.attributes.ranges['resonance'].min);
                assert.strictEqual(character.system.attributes.magic.value, SR.attributes.ranges['magic'].min);
            });

            it('Character monitor calculation', async () => {
                const actor = await testActor.create({type: 'character'}) as SR5Actor;

                let character = actor.asCharacter() as CharacterActorData;

                // Check default values.
                assert.strictEqual(character.system.track.stun.max, 9); // 8 + round_up(1 / 2)
                assert.strictEqual(character.system.track.physical.max, 9); // 8 + round_up(1 / 2)
                assert.strictEqual(character.system.track.physical.overflow.max, SR.attributes.ranges.body.min); // body value

                // Check calculated values after update.
                await actor.update({
                    'system.attributes.body.base': 6,
                    'system.attributes.willpower.base': 6,
                });

                character = actor.asCharacter() as CharacterActorData;
                assert.strictEqual(character.system.track.stun.max, 11); // 8 + round_up(6 / 2)
                assert.strictEqual(character.system.track.physical.max, 11); // 8 + round_up(6 / 2)
                assert.strictEqual(character.system.track.physical.overflow.max, 6); // body value
            });

            it('Matrix condition monitor track calculation with modifiers', async () => {
                const actor = await testActor.create({type: 'character', 'system.modifiers.matrix_track': 1}) as SR5Actor;
                await actor.createEmbeddedDocuments('Item', [{
                    'name': 'Commlink',
                    'type': 'device', 
                    'system.category': 'commlink', 
                    'system.technology.equipped': true
                }]);
                
                const character = actor.asCharacter() as CharacterActorData;
                assert.equal(character.system.matrix.condition_monitor.max, 10); // 9 + 1
            });

            it('Character initiative calculation', async () => {
                const actor = await testActor.create({type: 'character'}) as SR5Actor;

                let character = actor.asCharacter() as CharacterActorData;

                // Check default values.
                console.log('Meatspace Ini');
                assert.strictEqual(character.system.initiative.meatspace.base.base, 2); // REA+INT
                assert.strictEqual(character.system.initiative.meatspace.dice.base, 1);
                console.log('Matrix AR Ini');
                assert.strictEqual(character.system.initiative.matrix.base.base, 1); // No matrix device
                assert.strictEqual(character.system.initiative.matrix.dice.base, 3); // Cold SIM
                console.log('Magic Ini');
                assert.strictEqual(character.system.initiative.astral.base.base, 2); // INT+INT
                assert.strictEqual(character.system.initiative.astral.dice.base, 2);
            });

            it('Character limit calculation', async () => {
                const actor = await testActor.create({type: 'character'}) as SR5Actor;

                let character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.limits.physical.value, 2); // (STR*2 + BOD + REA) / 3
                assert.strictEqual(character.system.limits.mental.value, 2);   // (LOG*2 + INT + WIL) / 3
                assert.strictEqual(character.system.limits.social.value, 3);   // (CHA*2 + WILL + ESS) / 3

                await actor.update({
                    'system.attributes.strength.base': 6,
                    'system.attributes.body.base': 6,
                    'system.attributes.reaction.base': 6,
                    'system.attributes.logic.base': 6,
                    'system.attributes.intuition.base': 6,
                    'system.attributes.willpower.base': 6,
                    'system.attributes.charisma.base': 6,
                    'system.attributes.essence.base': 6,
                });

                character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.limits.physical.value, 8);
                assert.strictEqual(character.system.limits.mental.value, 8);
                assert.strictEqual(character.system.limits.social.value, 8);
            });

            it('Character movement calculation', async () => {
                const actor = await testActor.create({type: 'character'}) as SR5Actor;

                let character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.movement.walk.value, 2); // AGI * 2
                assert.strictEqual(character.system.movement.run.value, 4);  // AGI * 4

                await actor.update({
                    'system.attributes.agility.base': 6
                });

                character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.movement.walk.value, 12);
                assert.strictEqual(character.system.movement.run.value, 24);
            });

            it('Character skill calculation', async () => {
                const actor = await testActor.create({type: 'character'}) as SR5Actor;

                let character = actor.asCharacter() as CharacterActorData;

                await actor.update({
                    'system.skills.active.arcana.base': 6,
                    'system.skills.active.arcana.bonus': [{key: 'Test', value: 1}],
                    'system.skills.active.arcana.specs': ['Test']
                });

                character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.skills.active.arcana.value, 7);
            });

            it('Character damage application', async () => {
                const actor = await testActor.create({type: 'character'}) as SR5Actor;
                let character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.track.stun.value, 0);
                assert.strictEqual(character.system.track.stun.wounds, 0);
                assert.strictEqual(character.system.track.physical.value, 0);
                assert.strictEqual(character.system.track.physical.wounds, 0);

                assert.strictEqual(character.system.wounds.value, 0);

                await actor.update({
                    'system.track.stun.value': 3,
                    'system.track.physical.value': 3,
                });

                character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.track.stun.value, 3);
                assert.strictEqual(character.system.track.stun.wounds, 1);
                assert.strictEqual(character.system.track.physical.value, 3);
                assert.strictEqual(character.system.track.physical.wounds, 1);

                assert.strictEqual(character.system.wounds.value, 2);
            });

            it('Character damage application with high pain/wound tolerance', async () => {
                const actor = await testActor.create({type: 'character'}) as SR5Actor;
                let character = actor.asCharacter() as CharacterActorData;

                await actor.update({
                    'system.track.stun.value': 6,
                    'system.track.physical.value': 6,
                    'system.modifiers.wound_tolerance': 3
                });

                character = actor.asCharacter() as CharacterActorData;

                assert.strictEqual(character.system.track.stun.value, 6);
                assert.strictEqual(character.system.track.stun.wounds, 1); // would normally be 2 (-2)
                assert.strictEqual(character.system.track.physical.value, 6);
                assert.strictEqual(character.system.track.physical.wounds, 1);

                assert.strictEqual(character.system.wounds.value, 2); // would normally be 4 (-4)
            });
        });
        describe('SpiritDataPrep', () => {
            it('Spirits are always magical', async () => {
                const character = await testActor.create({type: 'spirit'}) as SR5Actor;

                assert.strictEqual(character.system.special, 'magic');
            });

            it('Spirit default/overrides by example type', async () => {
                const actor = await testActor.create({type: 'spirit', 'system.spiritType': 'air'}) as SR5Actor;
                let spirit = actor.asSpirit() as SpiritActorData;

                // Without adequate force there will be negative base values with minimum attribute values.
                assert.strictEqual(spirit.system.attributes.body.base, -2);
                assert.strictEqual(spirit.system.attributes.agility.base, 3);
                assert.strictEqual(spirit.system.attributes.reaction.base, 4);
                assert.strictEqual(spirit.system.attributes.strength.base, -3);
                assert.strictEqual(spirit.system.attributes.intuition.base, 0);

                assert.strictEqual(spirit.system.initiative.meatspace.base.base, 4); // force * 2 + override;

                assert.strictEqual(spirit.system.skills.active.assensing.base, 0);

                await actor.update({
                    'system.force': 6
                });

                spirit = actor.asSpirit() as SpiritActorData;

                assert.strictEqual(spirit.system.attributes.body.base, 4);
                assert.strictEqual(spirit.system.attributes.agility.base, 9);
                assert.strictEqual(spirit.system.attributes.reaction.base, 10);
                assert.strictEqual(spirit.system.attributes.strength.base, 3);
                assert.strictEqual(spirit.system.attributes.intuition.base, 6); // set by force without spirit type mods.

                assert.strictEqual(spirit.system.initiative.meatspace.base.base, 16);

                assert.strictEqual(spirit.system.skills.active.assensing.base, 6);
                assert.strictEqual(spirit.system.skills.active.arcana.base, 0); // not for this spirit type.
            });
        });
        describe('SpriteDataPrep', () => {
            it('Sprites are always resonat', async () => {
                const sprite = await testActor.create({type: 'sprite'});
                assert.strictEqual(sprite.system.special, 'resonance');
            });

            it('Sprites default/override values by example type', async () => {
                const actor = await testActor.create({type: 'sprite', 'system.spriteType': 'courier'}) as SR5Actor;
                let sprite = actor.asSprite() as SpriteActorData;

                assert.strictEqual(sprite.system.matrix.sleaze.base, 3);
                assert.strictEqual(sprite.system.matrix.data_processing.base, 1);
                assert.strictEqual(sprite.system.matrix.firewall.base, 2);
                assert.strictEqual(sprite.system.matrix.sleaze.base, 3);

                assert.strictEqual(sprite.system.initiative.matrix.base.base, 1);

                assert.strictEqual(sprite.system.skills.active.hacking.base, 0);

                await actor.update({
                    'system.level': 6
                });

                sprite = actor.asSprite() as SpriteActorData;

                assert.strictEqual(sprite.system.level, 6);

                assert.strictEqual(sprite.system.matrix.sleaze.base, 9);
                assert.strictEqual(sprite.system.matrix.data_processing.base, 7);
                assert.strictEqual(sprite.system.matrix.firewall.base, 8);
                assert.strictEqual(sprite.system.matrix.sleaze.base, 9);

                assert.strictEqual(sprite.system.initiative.matrix.base.base, 13);
                assert.strictEqual(sprite.system.initiative.matrix.dice.base, 4);

                assert.strictEqual(sprite.system.skills.active.hacking.base, 6);
                assert.strictEqual(sprite.system.skills.active.computer.base, 6); // all sprites
                assert.strictEqual(sprite.system.skills.active.electronic_warfare.base, 0); // not set by sprite type.
            })

            it('Matrix condition monitor track calculation with modifiers', async () => {
                const actor = await testActor.create({type: 'sprite'}) as SR5Actor;
                
                let sprite = actor.asSprite() as SpriteActorData;
                assert.equal(sprite.system.matrix.condition_monitor.max, 8);

                await actor.update({'system.modifiers.matrix_track': 1});
                sprite = actor.asSprite() as SpriteActorData;
                assert.equal(sprite.system.matrix.condition_monitor.max, 9);
            });
        });
        describe('VehicleDataPrep', () => {
                it('Matrix condition monitor track calculation with modifiers', async () => {
                const actor = await testActor.create({type: 'vehicle'}) as SR5Actor;
                
                let vehicle = actor.asVehicle() as VehicleActorData;
                assert.equal(vehicle.system.matrix.condition_monitor.max, 8);

                await actor.update({'system.modifiers.matrix_track': 1});
                vehicle = actor.asVehicle() as VehicleActorData;
                assert.equal(vehicle.system.matrix.condition_monitor.max, 9);
            });
        });
        describe('ICDataPrep', () => {
            it('Matrix condition monitor track calculation with modifiers', async () => {
                const actor = await testActor.create({type: 'ic'}) as SR5Actor;
                
                let ic = actor.asIC() as ICActorData;
                assert.equal(ic.system.matrix.condition_monitor.max, 8);

                await actor.update({'system.modifiers.matrix_track': 1});
                ic = actor.asIC() as ICActorData;
                assert.equal(ic.system.matrix.condition_monitor.max, 9);
            });
        });
}