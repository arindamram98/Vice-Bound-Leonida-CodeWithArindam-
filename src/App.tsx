import { useEffect, useRef, useState } from 'react';
import { BurgerJobModal } from './components/BurgerJobModal';
import { HUD } from './components/HUD';
import { MapModal } from './components/MapModal';
import { MiniGameModal } from './components/MiniGameModal';
import { PhoneModal } from './components/PhoneModal';
import { RadialWheelModal } from './components/RadialWheelModal';
import { TitleScreen } from './components/TitleScreen';
import { TouchControls } from './components/TouchControls';
import { ViceCityEngine } from './game/engine';
import { ActiveModalType, HudSnapshot } from './game/types';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ViceCityEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [modal, setModal] = useState<ActiveModalType>(null);
  const [modalPayload, setModalPayload] = useState<unknown>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new ViceCityEngine(container, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onOpenModal: (nextModal, payload) => {
        setModal(nextModal);
        setModalPayload(payload ?? null);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const engine = engineRef.current;

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#09090d]">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {hud && hud.screen === 'title' && (
        <TitleScreen
          onStart={(starter) => engine?.startGame(starter)}
          totalBuildings={hud.totalBuildingsCount}
          totalInteriors={hud.totalInteriorsCount}
          controlSettings={hud.controlSettings}
          onToggleTouchControls={() =>
            engine?.updateControlSettings({ touchControls: !hud.controlSettings.touchControls })
          }
          onUpdateControlSettings={(partial) => engine?.updateControlSettings(partial)}
        />
      )}

      {hud && hud.screen !== 'title' && (
        <HUD
          hud={hud}
          onSwitchProtagonist={() => engine?.switchProtagonist()}
          onTogglePartner={() => engine?.togglePartnerFollow()}
          onTogglePartnerInCar={() => engine?.togglePartnerInCar()}
          onOpenPhone={() => engine?.openModal('phone')}
          onOpenMap={() => engine?.openModal('map')}
          onOpenWheel={() => engine?.openModal('wheel')}
          onOpenPause={() => engine?.openModal('pause')}
          onCycleRadio={() => engine?.cycleRadioStation()}
          onToggleMute={() => engine?.toggleMute()}
          onToggleSlowMo={() => engine?.toggleSlowMo()}
          onCycleWeapon={(dir) => engine?.cycleWeapon(dir)}
          onRespawn={() => engine?.respawnPlayer()}
          onCollectRobberyBag={() => engine?.collectRobberyBag()}
          onContextAction={() => engine?.triggerContextInteractPublic()}
          onPayTaxiUpi={() => engine?.payTaxiUpi()}
          onSkipTaxiFare={() => engine?.skipTaxiFare()}
          onCancelTaxi={() => engine?.cancelTaxi()}
          onEatBurgerShop={() => engine?.eatAtBurgerShop()}
          onInvitePartnerSit={() => engine?.invitePartnerSitNearby()}
        />
      )}

      {hud && hud.screen === 'playing' && hud.controlSettings.touchControls && !modal && engine && (
        <TouchControls
          hud={hud}
          onMoveInput={(nx, nz) => engine.setTouchMoveInput(nx, nz)}
          onCameraLookDelta={(dyaw, dpitch) => engine.addCameraLookDelta(dyaw, dpitch)}
          onAttack={() => engine.triggerPrimaryAttackPublic()}
          onAimChange={(active) => engine.setAiming(active)}
          onToggleAim={() => engine.toggleAim()}
          onReload={() => engine.triggerReloadPublic()}
          onJump={() => engine.triggerJumpTouch()}
          onSprintToggle={(active) => engine.setSprintingTouch(active)}
          onVehicleInteract={() => engine.triggerVehicleInteractPublic()}
          onContextInteract={() => engine.triggerContextInteractPublic()}
          onVehicleInputs={(inputs) => engine.setVehicleTouchInputs(inputs)}
          onHorn={() => engine.triggerHorn()}
          onThrowThrowable={() => {
            const p = hud.protagonists[hud.activeId];
            if (p.equippedWeaponId === 'molotov' || (p.grenades <= 0 && p.molotovs > 0)) {
              engine.throwMolotov();
            } else {
              engine.throwGrenade();
            }
          }}
          onOpenWheel={() => engine.openModal('wheel')}
          onOpenMap={() => engine.openModal('map')}
          onOpenPhone={() => engine.openModal('phone')}
          onOpenPause={() => engine.openModal('pause')}
        />
      )}

      {hud && modal === 'phone' && engine && (
        <PhoneModal
          hud={hud}
          socialPosts={engine.getSocialPosts()}
          activities={engine.getActivities()}
          missions={engine.getMissions()}
          jobs={engine.getJobs()}
          onClose={() => engine.closeModal()}
          onOpenMap={() => engine.openModal('map')}
          onSetWaypoint={(x, z, label) => engine.setWaypoint(x, z, label)}
          onLaunchActivity={(id) => engine.launchActivityFromPhone(id)}
          onSelectMission={(id) => engine.selectMission(id)}
          onSwitchProtagonist={() => engine.switchProtagonist()}
          onTogglePartner={() => engine.togglePartnerFollow()}
          onTogglePartnerInCar={() => engine.togglePartnerInCar()}
          onCallPartner={() => engine.callPartnerOnPhone()}
          onSendMessage={(text, venue) => engine.sendPartnerMessage(text, venue)}
          onDepositBank={(amt) => engine.depositBank(amt)}
          onWithdrawBank={(amt) => engine.withdrawBank(amt)}
          onBuyBusiness={(id) => engine.buyBusiness(id)}
          onTradeStock={(sym, side) => engine.tradeStock(sym, side)}
          onOrderDarkWeb={(k, cost) => engine.orderDarkWebItem(k, cost)}
          onCycleRadio={() => engine.cycleRadioStation()}
          onToggleEarphones={() => engine.toggleEarphones()}
          onUseTraumaKit={() => engine.useTraumaKit()}
          onUsePainkiller={() => engine.usePainkiller()}
          onEatBurger={() => engine.eatBurger()}
          onBookTaxi={(x, z, label) => engine.bookTaxi(x, z, label)}
          onCancelTaxi={() => engine.cancelTaxi()}
        />
      )}

      {hud && modal === 'map' && engine && (
        <MapModal
          hud={hud}
          onClose={() => engine.closeModal()}
          onSetWaypoint={(x, z, label) => engine.setWaypoint(x, z, label)}
          onBookTaxi={(x, z, label) => engine.bookTaxi(x, z, label)}
        />
      )}

      {hud && modal === 'wheel' && engine && (
        <RadialWheelModal
          hud={hud}
          onClose={() => engine.closeModal()}
          onSelectWeapon={(weaponId) => engine.selectWeapon(weaponId)}
          onUseTraumaKit={() => engine.useTraumaKit()}
          onUsePainkiller={() => engine.usePainkiller()}
          onEatBurger={() => engine.eatBurger()}
          onCleanWeapon={() => engine.cleanEquippedWeapon()}
          onToggleEarphones={() => engine.toggleEarphones()}
          onToggleUmbrella={() => engine.toggleUmbrella()}
          onCycleRadio={() => engine.cycleRadioStation()}
        />
      )}

      {hud && modal === 'burgerjob' && engine && (
        <BurgerJobModal
          hud={hud}
          onClose={() => engine.closeModal()}
          onApply={() => engine.applyBurgerShot()}
          onToggleUniform={() => engine.putOnBurgerUniform()}
          onClockIn={() => engine.clockInBurgerShot()}
          onCompleteTask={(task, pay) => engine.completeBurgerShiftTask(task, pay)}
          onSetRole={(role) => engine.setBurgerRole(role)}
          onLaunchDelivery={() => engine.launchBurgerDelivery()}
          onStealRegister={() => engine.stealBurgerRegister()}
          onQuitChaos={() => engine.quitBurgerShotChaos()}
        />
      )}

      {hud &&
        modal &&
        modal !== 'phone' &&
        modal !== 'map' &&
        modal !== 'wheel' &&
        modal !== 'burgerjob' &&
        engine && (
          <MiniGameModal
            modal={modal}
            payload={modalPayload}
            hud={hud}
            onClose={() => engine.closeModal()}
            onResolveHotwire={(vid, ok) => engine.resolveHotwire(vid, ok)}
            onResolveRobbery={(iid, amt, clean) => engine.resolveRobbery(iid, amt, clean)}
            onWipeCctv={(iid) => engine.wipeCctvFootage(iid)}
            onNpcChoice={(nid, act) => engine.handleNpcChoice(nid, act)}
            onPartnerChoice={(choice) => engine.handlePartnerDirectChoice(choice)}
            onChangeAppearance={(outfit, hair, clear) => engine.changeAppearance(outfit, hair, clear)}
            onBuyClothesOutfit={(outfit, hair, clear, cost) => engine.buyClothesOutfit(outfit, hair, clear, cost)}
            onBuyBungalow={(bizId) => engine.buyBungalow(bizId)}
            onRestAtEstate={() => engine.sleepAtVillaBed()}
            onUpdateControlSettings={(partial) => engine.updateControlSettings(partial)}
            onShaveBeard={() => engine.shaveBeard()}
            onSwapTrunkWeapon={(wid, dir) => engine.swapWeaponWithTrunk(wid, dir)}
            onBuyWeaponStoreItem={(id) => engine.buyWeaponStoreItem(id)}
            onBuyFenceItem={(item) => engine.buyFenceItem(item)}
            onBuyAttachment={(kind) => engine.buyAttachment(kind)}
            onDepositBank={(amt) => engine.depositBank(amt)}
            onWithdrawBank={(amt) => engine.withdrawBank(amt)}
            onBuyBusiness={(id) => engine.buyBusiness(id)}
            onCompleteActivity={(aid, ok, bonus) => engine.completeMiniGame(aid, ok, bonus)}
            onCompleteJob={(jid, bonus) => engine.completeJobShift(jid, bonus)}
          />
        )}
    </div>
  );
}
